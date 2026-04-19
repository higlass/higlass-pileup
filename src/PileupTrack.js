import BAMDataFetcher from './bam-fetcher';
import { spawn, BlobWorker } from 'threads';
import {
  PILEUP_COLORS,
  PROTEIN_AMINO_ACIDS,
  DNA_BASES,
  cigarTypeToText,
  areMatesRequired,
  calculateInsertSize,
  posToChrPos,
  isProteinColorScale,
} from './bam-utils';

import MyWorkerWeb from 'raw-loader!../dist/worker.js';

const createColorTexture = (PIXI, colors) => {
  const colorTexRes = Math.max(2, Math.ceil(Math.sqrt(colors.length)));
  const rgba = new Float32Array(colorTexRes ** 2 * 4);
  colors.forEach((color, i) => {
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4] = color[0]; // r
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 1] = color[1]; // g
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 2] = color[2]; // b
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 3] = color[3]; // a
  });

  return [PIXI.Texture.fromBuffer(rgba, colorTexRes, colorTexRes), colorTexRes];
};

function transformY(p, t) {
  return p * t.k + t.y;
}

function invY(p, t) {
  return (p - t.y) / t.k;
}

function subPos(read, sub) {
  const subStart = read.from + sub.pos;
  const subEnd = read.from + sub.pos + sub.length;

  return [subStart, subEnd];
}

/** The distance between a substitution and the mouse position */
function calcSubDistance(mousePos, read, sub) {
  const [subStart, subEnd] = subPos(read, sub);
  let subDistance = null;
  if (mousePos < subStart) {
    subDistance = subStart - mousePos;
  } else if (mousePos > subEnd) {
    subDistance = mousePos - subEnd;
  } else {
    subDistance = 0;
  }

  return subDistance;
}

/** Find the thearest substition to the mouse position */
function findNearestSub(mousePos, read, nearestDistance) {
  const subs = read.substitutions;
  let nearestSub = null;
  let nearestSubDistance = Number.MAX_VALUE;

  for (const sub of subs) {
    const subDistance = calcSubDistance(mousePos, read, sub);
    if (subDistance < nearestSubDistance) {
      nearestSub = sub;
      nearestSubDistance = subDistance;
    }
  }

  if (nearestSubDistance < nearestDistance) {
    return nearestSub;
  }
  return null;
}

const scaleScalableGraphics = (graphics, xScale, drawnAtScale) => {
  const tileK =
    (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) /
    (xScale.domain()[1] - xScale.domain()[0]);
  const newRange = xScale.domain().map(drawnAtScale);

  const posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};

const getTilePosAndDimensions = (
  zoomLevel,
  tilePos,
  binsPerTileIn,
  tilesetInfo,
) => {
  /**
   * Get the tile's position in its coordinate system.
   *
   * TODO: Replace this function with one imported from
   * HGC.utils.trackUtils
   */
  const xTilePos = tilePos[0];
  const yTilePos = tilePos[1];

  if (tilesetInfo.resolutions) {
    // the default bins per tile which should
    // not be used because the right value should be in the tileset info

    const binsPerTile = binsPerTileIn;

    const sortedResolutions = tilesetInfo.resolutions
      .map((x) => +x)
      .sort((a, b) => b - a);

    const chosenResolution = sortedResolutions[zoomLevel];

    const tileWidth = chosenResolution * binsPerTile;
    const tileHeight = tileWidth;

    const tileX = chosenResolution * binsPerTile * tilePos[0];
    const tileY = chosenResolution * binsPerTile * tilePos[1];

    return {
      tileX,
      tileY,
      tileWidth,
      tileHeight,
    };
  }

  // max_width should be substitutable with 2 ** tilesetInfo.max_zoom
  const totalWidth = tilesetInfo.max_width;
  const totalHeight = tilesetInfo.max_width;

  const minX = tilesetInfo.min_pos[0];
  const minY = tilesetInfo.min_pos[1];

  const tileWidth = totalWidth / 2 ** zoomLevel;
  const tileHeight = totalHeight / 2 ** zoomLevel;

  const tileX = minX + xTilePos * tileWidth;
  const tileY = minY + yTilePos * tileHeight;

  return {
    tileX,
    tileY,
    tileWidth,
    tileHeight,
  };
};

const toVoid = () => {};
function eqSet(as, bs) {
  return as.size === bs.size && all(isIn(bs), as);
}

function all(pred, as) {
  for (var a of as) if (!pred(a)) return false;
  return true;
}

function isIn(as) {
  return (a) => as.has(a);
}

// When height changes by more than this factor from the last full render,
// trigger a new render instead of continuing to scale the existing mesh.
const HEIGHT_SCALE_THRESHOLD = 2.0;

const PileupTrack = (HGC, ...args) => {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"',
    );
  }

  class PileupTrackClass extends HGC.tracks.Tiled1DPixiTrack {
    constructor(context, options) {
      const worker = spawn(BlobWorker.fromText(MyWorkerWeb));

      // this is where the threaded tile fetcher is called
      // We also need to pass the track options as some of them influence how the data needs to be loaded
      context.dataFetcher = new BAMDataFetcher(
        context.dataConfig,
        options,
        worker,
        HGC,
      );

      super(context, options);
      context.dataFetcher.track = this;

      this.trackId = this.id;
      this.viewId = context.viewUid;
      this.originalHeight = context.definition.height;
      this.worker = worker;
      this.isShowGlobalMousePosition = context.isShowGlobalMousePosition;
      this.valueScaleTransform = HGC.libraries.d3Zoom.zoomIdentity;

      this.maxTileWidthReached = false;

      this.loadingText = new HGC.libraries.PIXI.Text('Loading', {
        fontSize: '12px',
        fontFamily: 'Arial',
        fill: 'grey',
      });

      this.loadingText.x = 100;
      this.loadingText.y = 100;

      this.loadingText.anchor.x = 0;
      this.loadingText.anchor.y = 0;

      this.pLabel.addChild(this.loadingText);

      this.externalInit(options);
    }

    // Some of the initialization code is factored out, so that we can
    // reset/reinitialize if an option change requires it
    externalInit(options) {
      // we scale the entire view up until a certain point
      // at which point we redraw everything to get rid of
      // artifacts
      // this.drawnAtScale keeps track of the scale at which
      // we last rendered everything
      this.drawnAtScale = HGC.libraries.d3Scale.scaleLinear();
      this.drawnAtHeight = null;
      this.heightScaleK = 1.0;
      this.rowsMeta = {};
      this.coverage = {};
      this.yScaleBands = {};

      // The bp distance for which the samples are chosen for the coverage.
      this.coverageSamplingDistance = 1;

      this.loadMates = areMatesRequired(this.options);
      // The following will be used to quickly find the mate when hovering over a read.
      // It will only be populated if this.loadMates==true to save memory
      this.readsById = {};
      this.previousTileIdsUsedForRendering = {};

      this.prevOptions = Object.assign({}, options);

      // graphics for highliting reads under the cursor
      this.mouseOverGraphics = new HGC.libraries.PIXI.Graphics();

      this.fetching = new Set();
      this.rendering = new Set();

      if (this.options.showMousePosition && !this.hideMousePosition) {
        this.hideMousePosition = HGC.utils.showMousePosition(
          this,
          this.is2d,
          this.isShowGlobalMousePosition(),
        );
      }

      this.setUpShaderAndTextures();
    }

    initTile() {}

    colorToArray(color) {
      const rgb = HGC.libraries.d3Color.rgb(color);

      const array = [rgb.r / 255, rgb.g / 255, rgb.b / 255, rgb.opacity];
      return array;
    }

    colorArrayToString(colorArray) {
      const r = Math.round(colorArray[0] * 255);
      const g = Math.round(colorArray[1] * 255);
      const b = Math.round(colorArray[2] * 255);
      const rgbaString = `rgba(${r}, ${g}, ${b}, ${colorArray[3]})`;
      const color = HGC.libraries.d3Color.color(rgbaString);
      return color.hex();
    }

    setUpShaderAndTextures() {
      const colorDict = PILEUP_COLORS;

      if (
        this.options &&
        this.options.colorScale &&
        this.options.colorScale.length == 6
      ) {
        [
          colorDict.A,
          colorDict.T,
          colorDict.G,
          colorDict.C,
          colorDict.N,
          colorDict.X,
        ] = this.options.colorScale.map((x) => this.colorToArray(x));
      } else if (
        this.options &&
        this.options.colorScale &&
        this.options.colorScale.length == 11
      ) {
        [
          colorDict.A,
          colorDict.T,
          colorDict.G,
          colorDict.C,
          colorDict.N,
          colorDict.X,
          colorDict.LARGE_INSERT_SIZE,
          colorDict.SMALL_INSERT_SIZE,
          colorDict.LL,
          colorDict.RR,
          colorDict.RL,
        ] = this.options.colorScale.map((x) => this.colorToArray(x));
      } else if (
        this.options &&
        this.options.colorScale &&
        this.options.colorScale.length == 21
      ) {
        // Protein color scale (21 amino acids)
        PROTEIN_AMINO_ACIDS.forEach((aa, i) => {
          colorDict[aa] = this.colorToArray(this.options.colorScale[i]);
        });
      } else if (
        this.options &&
        this.options.colorScale &&
        this.options.colorScale.length == 26
      ) {
        // Protein color scale with highlight colors (21 + 5)
        PROTEIN_AMINO_ACIDS.forEach((aa, i) => {
          colorDict[aa] = this.colorToArray(this.options.colorScale[i]);
        });
        [
          colorDict.LARGE_INSERT_SIZE,
          colorDict.SMALL_INSERT_SIZE,
          colorDict.LL,
          colorDict.RR,
          colorDict.RL,
        ] = this.options.colorScale.slice(21).map((x) => this.colorToArray(x));
      } else if (this.options && this.options.colorScale) {
        console.error(
          'colorScale must contain 6, 11, 21, or 26 entries. See https://github.com/higlass/higlass-pileup#options.',
        );
      }

      if (this.options && this.options.plusStrandColor) {
        colorDict.PLUS_STRAND = this.colorToArray(this.options.plusStrandColor);
      }

      if (this.options && this.options.minusStrandColor) {
        colorDict.MINUS_STRAND = this.colorToArray(
          this.options.minusStrandColor,
        );
      }

      const colors = Object.values(colorDict);

      const [colorMapTex, colorMapTexRes] = createColorTexture(
        HGC.libraries.PIXI,
        colors,
      );
      const uniforms = new HGC.libraries.PIXI.UniformGroup({
        uColorMapTex: colorMapTex,
        uColorMapTexRes: colorMapTexRes,
      });
      this.shader = HGC.libraries.PIXI.Shader.from(
        `
    attribute vec2 position;
    attribute float aColorIdx;

    uniform mat3 projectionMatrix;
    uniform mat3 translationMatrix;

    uniform sampler2D uColorMapTex;
    uniform float uColorMapTexRes;

    varying vec4 vColor;

    void main(void)
    {
        // Half a texel (i.e., pixel in texture coordinates)
        float eps = 0.5 / uColorMapTexRes;
        float colorRowIndex = floor((aColorIdx + eps) / uColorMapTexRes);
        vec2 colorTexIndex = vec2(
          (aColorIdx / uColorMapTexRes) - colorRowIndex + eps,
          (colorRowIndex / uColorMapTexRes) + eps
        );
        vColor = texture2D(uColorMapTex, colorTexIndex);

        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
    }

`,
        `
varying vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`,
        uniforms,
      );
    }

    rerender(options) {
      super.rerender(options);

      this.options = options;

      if (this.options.showMousePosition && !this.hideMousePosition) {
        this.hideMousePosition = HGC.utils.showMousePosition(
          this,
          this.is2d,
          this.isShowGlobalMousePosition(),
        );
      }

      if (!this.options.showMousePosition && this.hideMousePosition) {
        this.hideMousePosition();
        this.hideMousePosition = undefined;
      }

      this.setUpShaderAndTextures();
      // Snapshot prevOptions before any block below may mutate it (via externalInit).
      const prevOpts = this.prevOptions;

      // Reset everything and overwrite the datafetcher if the data needs to be loaded differently,
      // we need to realign or we need to recolor. Expensive, but only happens if options change.
      if (
        areMatesRequired(options) !== this.loadMates ||
        JSON.stringify(this.prevOptions.highlightReadsBy) !==
          JSON.stringify(options.highlightReadsBy) ||
        this.prevOptions.largeInsertSizeThreshold !==
          options.largeInsertSizeThreshold ||
        this.prevOptions.smallInsertSizeThreshold !==
          options.smallInsertSizeThreshold ||
        this.prevOptions.minMappingQuality !== options.minMappingQuality
      ) {
        this.dataFetcher = new BAMDataFetcher(
          this.dataFetcher.dataConfig,
          options,
          this.worker,
          HGC,
        );
        this.dataFetcher.track = this;

        this.rowsMeta = {};
        // New uid was created above, so prevRowsByUid in the worker has no
        // stale entry for it — no explicit reset needed.
        this.removeTiles(Object.keys(this.fetchedTiles));
        this.fetching.clear();
        this.refreshTiles();
        this.externalInit(options);
      }

      // Check if rows need to be recalculated
      if (
        JSON.stringify(this.prevOptions.sortByBase) !==
        JSON.stringify(this.options.sortByBase)
      ) {
        // Base sorting has changed — clear the worker-side prevRows cache so
        // the next render starts fresh without stale row assignments.
        this.rowsMeta = {};
        this.worker.then((tileFunctions) =>
          tileFunctions.resetPrevRows(this.dataFetcher.uid),
        );
      }

      // Only force a full re-render when track options changed or the track
      // has never been rendered. Pure width-only resizes are handled by
      // zoomed() via scaleScalableGraphics() before rerender() is called.
      // Height changes are handled by scaling the existing mesh until the
      // ratio from the last full render exceeds HEIGHT_SCALE_THRESHOLD, at
      // which point a new render is triggered (same pattern as x-axis zoom).
      const optionsChanged =
        JSON.stringify(options) !== JSON.stringify(prevOpts);

      if (optionsChanged || !this.segmentGraphics || !this.drawnAtHeight) {
        this.previousTileIdsUsedForRendering = {};
        this.updateExistingGraphics();
      } else if (this.dimensions[1] !== this.drawnAtHeight) {
        const heightK = this.dimensions[1] / this.drawnAtHeight;
        if (
          (heightK > HEIGHT_SCALE_THRESHOLD || heightK < 1 / HEIGHT_SCALE_THRESHOLD) &&
          !this.rendering.size
        ) {
          // Threshold exceeded and no render in flight: trigger a full re-render.
          // Guard on rendering.size so that if a render is already running we
          // fall through to the scaling branch below instead of triggering
          // another re-render (which would cause the old mesh to briefly shrink).
          this.previousTileIdsUsedForRendering = {};
          this.updateExistingGraphics();
        } else {
          this.heightScaleK = heightK;
          this.segmentGraphics.scale.y = this.heightScaleK * this.valueScaleTransform.k;
          this.segmentGraphics.position.y = this.valueScaleTransform.y * this.heightScaleK;
          this.animate();
        }
      }

      this.prevOptions = Object.assign({}, options);
    }

    updateExistingGraphics(force) {
      this.loadingText.text = 'Rendering...';

      const fetchedTileIds = new Set(Object.keys(this.fetchedTiles));
      if (!eqSet(this.visibleTileIds, fetchedTileIds)) {
        this.updateLoadingText();
        return;
      }

      // Prevent multiple renderings with the same tiles.
      // This can happen when multiple new tiles come in at once
      if (!force && eqSet(this.previousTileIdsUsedForRendering, fetchedTileIds)) {
        return;
      }
      this.previousTileIdsUsedForRendering = fetchedTileIds;

      const fetchedTileKeys = Object.keys(this.fetchedTiles);
      fetchedTileKeys.forEach((x) => {
        this.fetching.delete(x);
        this.rendering.add(x);
      });
      this.updateLoadingText();

      // Capture dimensions at dispatch time so the callback can detect any
      // height change that occurred while the worker was running.
      const renderedHeight = this.dimensions[1];

      this.worker.then((tileFunctions) => {
        tileFunctions
          .renderSegments(
            this.dataFetcher.uid,
            Object.values(this.fetchedTiles).map((x) => x.remoteId),
            this._xScale.domain(),
            this._xScale.range(),
            this.position,
            this.dimensions,
            this.options,
          )
          .then((toRender) => {
            this.loadingText.visible = false;

            fetchedTileKeys.forEach((x) => {
              this.rendering.delete(x);
            });
            this.updateLoadingText();

            if (this.maxTileWidthReached) {
              if (
                this.segmentGraphics &&
                this.options.collapseWhenMaxTileWidthReached
              ) {
                this.pMain.removeChild(this.segmentGraphics);
              }
              this.loadingText.visible = false;
              this.draw();
              this.animate();
              return;
            }

            this.errorTextText = null;
            this.pBorder.clear();
            this.drawError();
            this.animate();

            this.positions = new Float32Array(toRender.positionsBuffer);
            this.colors = new Float32Array(toRender.colorsBuffer);
            this.ixs = new Int32Array(toRender.ixBuffer);

            const newGraphics = new HGC.libraries.PIXI.Graphics();

            this.rowsMeta = toRender.rowsMeta;
            this._hoverReadCache = null; // invalidate after every render
            this.coverage = toRender.coverage;
            this.coverageSamplingDistance = toRender.coverageSamplingDistance;

            if (this.loadMates) {
              // Segment detail data is cached in the worker; readsById is
              // populated by the worker-side prevRowsByUid cache. Mate hover
              // requires a future lazy worker lookup.
              this.readsById = {};
            }

            const geometry = new HGC.libraries.PIXI.Geometry().addAttribute(
              'position',
              this.positions,
              2,
            ); // x,y
            geometry.addAttribute('aColorIdx', this.colors, 1);
            geometry.addIndex(this.ixs);

            if (this.positions.length) {
              const state = new HGC.libraries.PIXI.State();
              const mesh = new HGC.libraries.PIXI.Mesh(
                geometry,
                this.shader,
                state,
              );

              newGraphics.addChild(mesh);
            }

            this.pMain.x = this.position[0];

            if (this.segmentGraphics) {
              this.pMain.removeChild(this.segmentGraphics);
            }

            this.pMain.addChild(newGraphics);
            this.segmentGraphics = newGraphics;

            // remove and add again to place on top
            this.pMain.removeChild(this.mouseOverGraphics);
            this.pMain.addChild(this.mouseOverGraphics);

            this.yScaleBands = {};
            for (const key in this.rowsMeta) {
              const { rowCount, start, end } = this.rowsMeta[key];
              this.yScaleBands[key] = HGC.libraries.d3Scale
                .scaleBand()
                .domain(HGC.libraries.d3Array.range(0, rowCount))
                .range([start, end])
                .paddingInner(0.2);
            }

            this.drawnAtScale = HGC.libraries.d3Scale
              .scaleLinear()
              .domain(toRender.xScaleDomain)
              .range(toRender.xScaleRange);
            // Use the height the worker actually rendered at, not the current
            // (potentially different) height. If the track was resized while
            // the worker was running, scale the mesh to fill current height.
            this.drawnAtHeight = renderedHeight;
            this.heightScaleK = this.dimensions[1] / renderedHeight;

            scaleScalableGraphics(
              this.segmentGraphics,
              this._xScale,
              this.drawnAtScale,
            );

            // if somebody zoomed vertically, we want to readjust so that
            // they're still zoomed in vertically
            this.segmentGraphics.scale.y = this.heightScaleK * this.valueScaleTransform.k;
            this.segmentGraphics.position.y = this.valueScaleTransform.y * this.heightScaleK;

            this.draw();
            this.animate();
          });
        // .catch(err => {
        //   // console.log('err:', err);
        //   // console.log('err:', err.message);
        //   this.errorTextText = err.message;

        //   // console.log('errorTextText:', this.errorTextText);
        //   // this.draw();
        //   // this.animate();
        //   this.drawError();
        //   this.animate();

        //   // console.log('this.pBorder:', this.pBorder);
        // });
      });
    }

    updateLoadingText() {
      this.loadingText.visible = true;
      this.loadingText.text = '';

      if (!this.tilesetInfo) {
        this.loadingText.text = 'Fetching tileset info...';
        return;
      }

      if (this.fetching.size) {
        this.loadingText.text = `Fetching... ${[...this.fetching]
          .map((x) => x.split('|')[0])
          .join(' ')}`;
      }

      if (this.rendering.size) {
        this.loadingText.text = `Rendering... ${[...this.rendering].join(' ')}`;
      }

      if (!this.fetching.size && !this.rendering.size) {
        this.loadingText.visible = false;
      }
    }

    draw() {
      const tileK =
        (this.drawnAtScale.domain()[1] - this.drawnAtScale.domain()[0]) /
        (this._xScale.domain()[1] - this._xScale.domain()[0]);

      if (tileK > 3 && !this.rendering.size) {
        this.updateExistingGraphics(true);
      }
      // const valueScale = HGC.libraries.d3Scale
      //   .scaleLinear()
      //   .domain([0, this.prevRows.length])
      //   .range([0, this.dimensions[1]]);
      // HGC.utils.trackUtils.drawAxis(this, valueScale);
      this.trackNotFoundText.text = 'Track not found.';
      this.trackNotFoundText.visible = true;
    }

    contextMenuItems(trackX, trackY) {
      /* Get a list of context menu items to display and the actions
         to take */
      if (Number.isNaN(trackX)) {
        return []
      }
      
      const currPos = Math.floor(this._xScale.invert(trackX));
      const chrPos = posToChrPos(currPos, this.tilesetInfo.chromsizes);
      


      // This should return items like this:
      let menuItems = [
        {
          label: 'Sort by base',
          onClick: (evt, onTrackOptionsChanged) => {
            // The onTrackOptionsChanged handler will handle any changes
            // to the track's options that are triggered in this event.
            // The only thing that needs to be passed is the new option being
            // passed


            onTrackOptionsChanged({
              sortByBase: {
                chr: chrPos[0],
                pos: chrPos[1],
              },
            });
          },
        },
      ];

      if (this.tilesetInfo.columns) {
        this.tilesetInfo.columns.forEach(x => {
          menuItems.push({
            label: `Sort by column [${x}]`,
            onClick: (evt, onTrackOptionsChanged) => {
              // The onTrackOptionsChanged handler will handle any changes
              // to the track's options that are triggered in this event.
              // The only thing that needs to be passed is the new option being
              // passed

              onTrackOptionsChanged({
                sortByBase: {
                  chr: chrPos[0],
                  pos: chrPos[1],
                  column: x
                },
              });
            },
          })
        }) 
      }

      return menuItems;
    }

    getMouseOverHtml(trackX, trackYIn) {
      this.mouseOverGraphics.clear();
      // Prevents 'stuck' read outlines when hovering quickly
      requestAnimationFrame(this.animate);
      // heightScaleK scales the segment mesh when the track is resized between
      // full re-renders. Divide trackYIn by it to bring the mouse position back
      // into the coordinate space used by yScaleBands (which are always in the
      // pre-heightScaleK pixel space).
      const heightScaleK = this.heightScaleK || 1;
      const trackY = invY(trackYIn / heightScaleK, this.valueScaleTransform);

      const bandCoverageStart = 0;
      let bandCoverageEnd = Number.MAX_SAFE_INTEGER;

      if (this.yScaleBands) {
        for (const key of Object.keys(this.yScaleBands)) {
          const yScaleBand = this.yScaleBands[key];

          const [start, end] = yScaleBand.range();

          bandCoverageEnd = Math.min(start, bandCoverageEnd);

          if (start <= trackY && trackY <= end) {
            const eachBand = yScaleBand.step();
            const index = Math.floor((trackY - start) / eachBand);
            const rowCount = this.rowsMeta[key] && this.rowsMeta[key].rowCount;
            if (rowCount == null) continue;

            if (index >= 0 && index < rowCount) {
              const genomicPos = this._xScale.invert(trackX);

              // Check whether the last async lookup result covers this position.
              const cache = this._hoverReadCache;
              if (
                cache &&
                cache.key === key &&
                cache.rowIndex === index &&
                Math.abs(cache.genomicPos - genomicPos) < 0.5
              ) {
                // Re-draw outlines every call so they follow scale transforms.
                if (cache.read) {
                  this._drawHoverOutlines(cache.read, index, yScaleBand);
                }
                return cache.html;
              }

              // Cache miss: fire off a worker hit-test. Return the previous
              // cached tooltip while the new result is in-flight so the
              // tooltip doesn't flicker to empty between nearby reads.
              this._lookupHoverRead(key, index, genomicPos, trackX);
              return cache ? cache.html : '';
            }
          }
        }

        if (
          this.options.showCoverage &&
          bandCoverageStart <= trackY &&
          trackY <= bandCoverageEnd
        ) {
          const mousePos = this._xScale.invert(trackX);
          let bpIndex = Math.floor(mousePos);
          bpIndex = bpIndex - (bpIndex % this.coverageSamplingDistance);
          if (this.coverage[bpIndex]) {
            const readCount = this.coverage[bpIndex];
            const matchPercent = (readCount.matches / readCount.reads) * 100;
            const range = readCount.range.includes('-')
              ? `Range: ${readCount.range}<br>`
              : `Position: ${readCount.range}<br>`;
            let mouseOverHtml =
              `Reads: ${readCount.reads}<br>` +
              `Matches: ${readCount.matches} (${matchPercent.toFixed(
                2,
              )}%)<br>` +
              range;

            for (const variant of Object.keys(readCount.variants)) {
              if (readCount.variants[variant] > 0) {
                const variantPercent =
                  (readCount.variants[variant] / readCount.reads) * 100;
                mouseOverHtml += `${variant}: ${
                  readCount.variants[variant]
                } (${variantPercent.toFixed(2)}%)<br>`;
              }
            }

            return mouseOverHtml;
          }
        }
      }

      return '';
    }

    /**
     * Fire an async worker hit-test for the read at (groupKey, rowIndex,
     * genomicPos). When the result arrives the hover cache is updated and the
     * canvas re-rendered so the tooltip and outlines appear on the next
     * mousemove event (typically within one rAF).
     */
    _lookupHoverRead(key, rowIndex, genomicPos, trackX) {
      const serial = (this._hoverLookupSerial =
        (this._hoverLookupSerial || 0) + 1);

      this.dataFetcher.getReadAtPosition(key, rowIndex, genomicPos).then(
        (read) => {
          if (this._hoverLookupSerial !== serial) return; // stale

          const html = read ? this._buildHoverHtml(read, trackX) : '';
          this._hoverReadCache = {
            key,
            rowIndex,
            genomicPos,
            read: read || null,
            html,
          };

          if (read) {
            const yScaleBand = this.yScaleBands && this.yScaleBands[key];
            if (yScaleBand) {
              this._drawHoverOutlines(read, rowIndex, yScaleBand);
            }
            this.animate();
          }
        },
      );
    }

    /** Draw the read (and optionally mate) outline box on mouseOverGraphics. */
    _drawHoverOutlines(read, rowIndex, yScaleBand) {
      const heightScaleK = this.heightScaleK || 1;
      if (this.options.outlineReadOnHover) {
        const xPos = this._xScale(read.from);
        const yPos =
          heightScaleK * transformY(yScaleBand(rowIndex), this.valueScaleTransform);
        const width = this._xScale(read.to) - this._xScale(read.from);
        const height =
          yScaleBand.bandwidth() * this.valueScaleTransform.k * heightScaleK;
        this.mouseOverGraphics.lineStyle({ width: 1, color: 0 });
        this.mouseOverGraphics.drawRect(xPos, yPos, width, height);
      }

      if (this.options.outlineMateOnHover) {
        this.outlineMate(read, yScaleBand);
      }
    }

    /** Build the tooltip HTML string for a read returned by the worker. */
    _buildHoverHtml(read, trackX) {
      const MAX_DIST = 10;
      const nearestDistance =
        this._xScale.invert(MAX_DIST) - this._xScale.invert(0);
      const mousePos = this._xScale.invert(trackX);
      const nearestSub = findNearestSub(mousePos, read, nearestDistance);

      const insertSizeHtml = this.getInsertSizeMouseoverHtml(read);

      let chimericReadHtml = '';
      if (read.mate_ids) {
        chimericReadHtml =
          read.mate_ids.length > 1
            ? `<span style="color:red;">Chimeric alignment</span><br>`
            : '';
      }

      let mappingOrientationHtml = ``;
      if (read.mappingOrientation) {
        let style = ``;
        if (read.colorOverride) {
          const color = Object.keys(PILEUP_COLORS)[read.colorOverride];
          const htmlColor = this.colorArrayToString(PILEUP_COLORS[color]);
          style = `style="color:${htmlColor};"`;
        }
        mappingOrientationHtml = `<span ${style}> Mapping orientation: ${read.mappingOrientation}</span><br>`;
      }

      let extra = read.extra;
      if (read.extra && this.options.someExtra) {
        extra = {};
        for (let he of this.options.someExtra) {
          extra[he] = read.extra[he];
        }
      } else if (read.extra && this.options.hideExtra) {
        extra = read.extra;
        for (let he of this.options.hideExtra) {
          delete extra[he];
        }
      }

      let positionTxt;
      if (read.chrName) {
        positionTxt = `${read.chrName}:${read.from - read.chrOffset}`;
      } else {
        positionTxt = `${read.from}`;
      }

      let mouseOverHtml =
        `ID: ${read.id}<br>` +
        `Position: ${positionTxt}<br>` +
        `Read length: ${read.to - read.from}<br>` +
        `MAPQ: ${read.mapq}<br>` +
        `Strand: ${read.strand}<br>` +
        insertSizeHtml +
        chimericReadHtml +
        mappingOrientationHtml +
        (extra ? `Extra: ${JSON.stringify(extra, null, 2)}<br>` : '');

      if (nearestSub && nearestSub.type && nearestSub.type != 'X') {
        mouseOverHtml += `Nearest substitution: ${cigarTypeToText(
          nearestSub.type,
        )} (${nearestSub.length})`;
      } else if (nearestSub && nearestSub.variant) {
        mouseOverHtml += `Nearest substitution: ${nearestSub.base} &rarr; ${nearestSub.variant}`;
      }

      return mouseOverHtml;
    }

    getInsertSizeMouseoverHtml(read) {
      let insertSizeHtml = ``;
      if (
        this.options.highlightReadsBy.includes('insertSize') ||
        this.options.highlightReadsBy.includes('insertSizeAndPairOrientation')
      ) {
        if (
          read.mate_ids.length === 1 &&
          read.mate_ids[0] &&
          read.mate_ids[0] in this.readsById
        ) {
          const mate = this.readsById[read.mate_ids[0]];
          const insertSize = calculateInsertSize(read, mate);
          let style = ``;
          if (
            ('largeInsertSizeThreshold' in this.options &&
              insertSize > this.options.largeInsertSizeThreshold) ||
            ('smallInsertSizeThreshold' in this.options &&
              insertSize < this.options.smallInsertSizeThreshold)
          ) {
            const color =
              Object.keys(PILEUP_COLORS)[read.colorOverride || read.color];
            const htmlColor = this.colorArrayToString(PILEUP_COLORS[color]);
            style = `style="color:${htmlColor};"`;
          }
          insertSizeHtml = `Insert size: <span ${style}>${insertSize}</span><br>`;
        }
      }
      return insertSizeHtml;
    }

    outlineMate(read, yScaleBand) {
      read.mate_ids.forEach((mate_id) => {
        if (!this.readsById[mate_id]) {
          return;
        }
        const mate = this.readsById[mate_id];
        const heightScaleK = this.heightScaleK || 1;
        // We assume the mate height is the same, but width might be different
        const mate_width = this._xScale(mate.to) - this._xScale(mate.from);
        const mate_height =
          yScaleBand.bandwidth() * this.valueScaleTransform.k * heightScaleK;
        const mate_xPos = this._xScale(mate.from);
        const mate_yPos =
          heightScaleK *
          transformY(
            this.yScaleBands[mate.groupKey](mate.row),
            this.valueScaleTransform,
          );
        this.mouseOverGraphics.lineStyle({
          width: 1,
          color: 0,
        });
        this.mouseOverGraphics.drawRect(
          mate_xPos,
          mate_yPos,
          mate_width,
          mate_height,
        );
      });
      this.animate();
    }

    calculateZoomLevel() {
      return HGC.utils.trackUtils.calculate1DZoomLevel(
        this.tilesetInfo,
        this._xScale,
        this.maxZoom,
      );
    }

    calculateVisibleTiles() {
      const tiles = HGC.utils.trackUtils.calculate1DVisibleTiles(
        this.tilesetInfo,
        this._xScale,
      );

      for (const tile of tiles) {
        const { tileX, tileWidth } = getTilePosAndDimensions(
          tile[0],
          [tile[1]],
          this.tilesetInfo.tile_size,
          this.tilesetInfo,
        );

        const DEFAULT_MAX_TILE_WIDTH = 2e5;
        const currentMaxTileWidth =
          (this.dataFetcher.dataConfig.options &&
            this.dataFetcher.dataConfig.options.maxTileWidth) ||
          this.options.maxTileWidth ||
          DEFAULT_MAX_TILE_WIDTH;
        if (
          tileWidth > (this.tilesetInfo.max_tile_width || currentMaxTileWidth)
        ) {
          if (this.options.collapseWhenMaxTileWidthReached) {
            this.pubSub.publish('trackDimensionsModified', {
              height: 20,
              resizeParentDiv: true,
              trackId: this.trackId,
              viewId: this.viewId,
            });
          }
          const errorText =
            `Zoom in to see details.\n` +
            `Current tile span ${tileWidth}. Max span: ${currentMaxTileWidth}`;

          this.setError(errorText, 'PileupTrack.tileWidth');
          this.updateLoadingText();
          this.drawError();
          this.animate();
          this.maxTileWidthReached = true;
          return;
        } else {
          this.maxTileWidthReached = false;
          this.setError('', 'PileupTrack.tileWidth');

          if (this.options.collapseWhenMaxTileWidthReached) {
            this.pubSub.publish('trackDimensionsModified', {
              height: this.originalHeight,
              resizeParentDiv: true,
              trackId: this.trackId,
              viewId: this.viewId,
            });
          }
        }

        this.pBorder.clear();
        this.drawError();
        this.animate();
      }
      // const { tileX, tileWidth } = getTilePosAndDimensions(
      //   this.calculateZoomLevel(),
      // )

      this.setVisibleTiles(tiles);
    }

    setPosition(newPosition) {
      super.setPosition(newPosition);

      [this.pMain.position.x, this.pMain.position.y] = this.position;
      [this.pMouseOver.position.x, this.pMouseOver.position.y] = this.position;

      [this.loadingText.x, this.loadingText.y] = newPosition;
    }

    movedY(dY) {
      const vst = this.valueScaleTransform;
      // valueScaleTransform is stored in the drawn coordinate space, so clamp
      // bounds must use the drawn height, not the current (possibly rescaled) height.
      const virtualHeight = this.dimensions[1] / this.heightScaleK;

      // clamp at the bottom and top
      if (
        vst.y + dY / vst.k > -(vst.k - 1) * virtualHeight &&
        vst.y + dY / vst.k < 0
      ) {
        this.valueScaleTransform = vst.translate(0, dY / vst.k);
      }

      // this.segmentGraphics may not have been initialized if the user
      // was zoomed out too far
      if (this.segmentGraphics) {
        this.segmentGraphics.position.y = this.valueScaleTransform.y * this.heightScaleK;
      }

      this.animate();
    }

    zoomedY(yPos, kMultiplier) {
      // valueScaleTransform is stored in the drawn coordinate space ([0, drawnAtHeight]).
      // Convert yPos and height into that space so the zoom anchor and clamp bounds
      // are computed correctly when heightScaleK != 1.
      const virtualYPos = yPos / this.heightScaleK;
      const virtualHeight = this.dimensions[1] / this.heightScaleK;
      const newTransform = HGC.utils.trackUtils.zoomedY(
        virtualYPos,
        kMultiplier,
        this.valueScaleTransform,
        virtualHeight,
      );

      this.valueScaleTransform = newTransform;
      this.segmentGraphics.scale.y = this.heightScaleK * newTransform.k;
      this.segmentGraphics.position.y = newTransform.y * this.heightScaleK;

      this.mouseOverGraphics.clear();
      this.animate();
    }

    zoomed(newXScale, newYScale) {
      super.zoomed(newXScale, newYScale);

      if (this.segmentGraphics) {
        scaleScalableGraphics(
          this.segmentGraphics,
          newXScale,
          this.drawnAtScale,
        );
      }
      this.mouseOverGraphics.clear();
      this.animate();
    }

    exportSVG() {
      let track = null;
      let base = null;

      // The following section is commented out because the base class
      // will export things like the track label.
      // This is fine for normal tracks that only add to that but this
      // pileup track's export function actually takes a screenshot of the
      // canvas and exports that.
      // This means elements rendered by the superclass are duplicated in this
      // track and cause artifacts if they don't overlap perfectly.
      // For that reason, we'll just treat this track as if it has no ancestors
      // and create the entire image from the canvas.
      // if (super.exportSVG) {
      //   [base, track] = super.exportSVG();
      // } else {
      base = document.createElement('g');
      track = base;
      // }

      const output = document.createElement('g');
      track.appendChild(output);

      output.setAttribute(
        'transform',
        `translate(${this.pMain.position.x},${this.pMain.position.y}) scale(${this.pMain.scale.x},${this.pMain.scale.y})`,
      );

      const gSegment = document.createElement('g');
      output.appendChild(gSegment);

      if (this.segmentGraphics) {
        const b64string = HGC.services.pixiRenderer.plugins.extract.base64(
          // this.segmentGraphics, 'image/png', 1,
          this.pMain.parent.parent,
        );

        // const xPositions = this.positions.filter((x,i) => i%2 == 0);
        // let minX = Number.MAX_SAFE_INTEGER;

        // for (let i = 0; i < xPositions.length; i++) {
        //   if (xPositions[i] < minX) {
        //     minX = xPositions[i];
        //   }
        // }
        const gImage = document.createElement('g');

        gImage.setAttribute('transform', `translate(0,0)`);

        const image = document.createElement('image');
        image.setAttributeNS(
          'http://www.w3.org/1999/xlink',
          'xlink:href',
          b64string,
        );
        gImage.appendChild(image);
        gSegment.appendChild(gImage);

        // gSegment.appendChild(image);
      }
      // if (this.positions) {
      //   // short for colorIndex
      //   let ci = 0;

      //   for (let i = 0; i < this.positions.length; i += 12) {
      //     const rect = document.createElement('rect');

      //     rect.setAttribute('x', this.positions[i]);
      //     rect.setAttribute('y', this.positions[i + 1]);

      //     rect.setAttribute(
      //       'width',
      //       this.positions[i + 10] - this.positions[i]
      //     );

      //     rect.setAttribute(
      //       'height',
      //       this.positions[i + 11] - this.positions[i + 1]
      //     );

      //     const red = Math.ceil(255 * this.colors[ci]);
      //     const green = Math.ceil(255 * this.colors[ci + 1]);
      //     const blue = Math.ceil(255 * this.colors[ci + 2]);
      //     const alpha = this.colors[ci + 3];

      //     rect.setAttribute('fill', `rgba(${red},${green},${blue},${alpha})`);
      //     gSegment.appendChild(rect);
      //     ci += 24;
      //   }
      // }

      return [base, base];
    }
  }

  return new PileupTrackClass(...args);
};

const icon =
  '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';

PileupTrack.config = {
  type: 'pileup',
  datatype: ['reads'],
  orientation: '1d-horizontal',
  name: 'Pileup Track',
  thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
  availableOptions: [
    'axisPositionHorizontal',
    'axisLabelFormatting',
    'colorScale',
    'groupBy',
    'labelPosition',
    'labelLeftMargin',
    'labelRightMargin',
    'labelTopMargin',
    'labelBottomMargin',
    'labelColor',
    'labelTextOpacity',
    'labelBackgroundOpacity',
    'outlineReadOnHover',
    'outlineMateOnHover',
    'showMousePosition',
    'workerScriptLocation',
    'plusStrandColor',
    'minusStrandColor',
    'showCoverage',
    'coverageHeight',
    'maxTileWidth',
    'collapseWhenMaxTileWidthReached',
    'minMappingQuality',
    'highlightReadsBy',
    'smallInsertSizeThreshold',
    'largeInsertSizeThreshold',
    'viewAsPairs',
    // 'minZoom'
  ],
  defaultOptions: {
    // minZoom: null,
    axisPositionHorizontal: 'right',
    axisLabelFormatting: 'normal',
    colorScale: [
      // A T G C N other
      '#08519c',
      '#6baed6',
      '#993404',
      '#fe9929',
      '#808080',
      '#DCDCDC',
    ],
    outlineReadOnHover: false,
    outlineMateOnHover: false,
    showMousePosition: false,
    showCoverage: false,
    coverageHeight: 10, // unit: number of rows
    maxTileWidth: 2e5,
    collapseWhenMaxTileWidthReached: false,
    minMappingQuality: 0,
    highlightReadsBy: [],
    largeInsertSizeThreshold: 1000,
    viewAsPairs: false,
  },
  optionsInfo: {
    outlineReadOnHover: {
      name: 'Outline read on hover',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes',
        },
        no: {
          value: false,
          name: 'No',
        },
      },
    },
    outlineMateOnHover: {
      name: 'Outline read mate on hover',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes',
        },
        no: {
          value: false,
          name: 'No',
        },
      },
    },
    highlightReadsBy: {
      name: 'Highlight reads by',
      inlineOptions: {
        none: {
          value: [],
          name: 'None',
        },
        insertSize: {
          value: ['insertSize'],
          name: 'Insert size',
        },
        pairOrientation: {
          value: ['pairOrientation'],
          name: 'Pair orientation',
        },
        insertSizeAndPairOrientation: {
          value: ['insertSizeAndPairOrientation'],
          name: 'Insert size and pair orientation',
        },
        insertSizeOrPairOrientation: {
          value: ['insertSize', 'pairOrientation'],
          name: 'Insert size or pair orientation',
        },
      },
    },
    minMappingQuality: {
      name: 'Minimal read mapping quality',
      inlineOptions: {
        zero: {
          value: 0,
          name: '0',
        },
        one: {
          value: 1,
          name: '1',
        },
        five: {
          value: 5,
          name: '5',
        },
        ten: {
          value: 10,
          name: '10',
        },
        twentyfive: {
          value: 25,
          name: '25',
        },
        fifty: {
          value: 50,
          name: '50',
        },
      },
    },
    showCoverage: {
      name: 'Show coverage',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes',
        },
        no: {
          value: false,
          name: 'No',
        },
      },
    },
    viewAsPairs: {
      name: 'View as pairs',
      inlineOptions: {
        yes: {
          value: true,
          name: 'Yes',
        },
        no: {
          value: false,
          name: 'No',
        },
      },
    },
    groupBy: {
      name: 'Group by',
      inlineOptions: {
        strand: {
          value: 'strand',
          name: 'Strand',
        },
        hpTag: {
          value: 'tags.HP',
          name: 'HP tag',
        },
        nothing: {
          value: null,
          name: 'Nothing',
        },
      },
    },
    colorScale: {
      name: 'Color scheme',
      inlineOptions: {
        drums: {
          value: [
            // A T G C N other
            '#007FFF',
            '#e8e500',
            '#008000',
            '#FF0038',
            '#800080',
            '#DCDCDC',
          ],
          name: 'DRuMS',
        },
        logos: {
          value: [
            // A T G C N other
            '#22ca03',
            '#c40003',
            '#f6af08',
            '#0000c7',
            '#808080',
            '#DCDCDC',
          ],
          name: 'Logos / IGV',
        },
        bluesGreens: {
          value: [
            // A T G C N other
            '#a6cee3',
            '#1f78b4',
            '#b2df8a',
            '#33a02c',
            '#808080',
            '#DCDCDC',
          ],
          name: 'Blues / Greens  (CB friendly)',
        },
        bluesBeiges: {
          value: [
            '#08519c',
            '#6baed6',
            '#993404',
            '#fe9929',
            '#808080',
            '#DCDCDC',
          ],
          name: 'Blues / Beiges (CB friendly, default)',
        },
        proteinDefault: {
          value: [
            // ALA ARG ASN ASP CYS GLN GLU GLY HIS ILE LEU LYS MET PHE PRO SER THR TRP TYR VAL STOP
            '#CCCCCC', '#0000FF', '#00FFFF', '#FF0000', '#FFFF00', '#00FFFF', '#FF0000', '#E6E6E6',
            '#0000FF', '#00FF00', '#00FF00', '#0000FF', '#00FF00', '#00FF00', '#FF8000', '#00FFFF',
            '#00FFFF', '#00FF00', '#00FFFF', '#00FF00', '#000000'
          ],
          name: 'Protein (by chemical properties)',
        },
        proteinHydrophobic: {
          value: [
            // ALA ARG ASN ASP CYS GLN GLU GLY HIS ILE LEU LYS MET PHE PRO SER THR TRP TYR VAL STOP
            '#FFA500', '#4169E1', '#32CD32', '#DC143C', '#FFD700', '#32CD32', '#DC143C', '#D3D3D3',
            '#4169E1', '#228B22', '#228B22', '#4169E1', '#228B22', '#228B22', '#FF4500', '#32CD32',
            '#32CD32', '#228B22', '#32CD32', '#228B22', '#000000'
          ],
          name: 'Protein (hydrophobicity)',
        },
      },
    },
  },
};

export default PileupTrack;
