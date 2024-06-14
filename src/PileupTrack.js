import BAMDataFetcher from './bam-fetcher';
import { spawn, BlobWorker } from 'threads';
import { 
  PILEUP_COLORS, 
  indexDHSColors, 
  fireColors, 
  cigarTypeToText, 
  areMatesRequired, 
  calculateInsertSize 
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
  return function (a) {
    return as.has(a);
  };
}

const PileupTrack = (HGC, ...args) => {
  /**
     if (!new.target) {
       throw new Error(
         'Uncaught TypeError: Class constructor cannot be invoked without "new"',
       );
     }
    */

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

      // console.log(`${this.id} | options ${JSON.stringify(options)}`);

      this.trackId = this.id;
      this.viewId = context.viewUid;
      this.originalHeight = context.definition.height;
      this.worker = worker;
      this.isShowGlobalMousePosition = context.isShowGlobalMousePosition;
      this.valueScaleTransform = HGC.libraries.d3Zoom.zoomIdentity;
      this.trackUpdatesAreFrozen = false;

      // this.optionsDict = {};
      // this.optionsDict[trackId] = options;

      // this.backgroundColor = (options.methylation) ? '#1c1c1cff' : (options.indexDHS) '#00000000';

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

      if (this.options.showLoadingText) {
        this.pLabel.addChild(this.loadingText);
      }

      this.externalInit(options);

      // console.log(`setting up pileup-track: ${this.id}`);

      this.bc = new BroadcastChannel(`pileup-track-${this.id}`);
      this.bc.postMessage({state: 'loading', msg: this.loadingText.text, uid: this.id});

      this.monitor = new BroadcastChannel(`pileup-track-viewer`);
      this.monitor.onmessage = (event) => this.handlePileupTrackViewerMessage(event.data);

      // this.handlePileupMessage = this.handlePileupTrackViewerMessage;
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
      this.prevRows = [];
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

      this.clusterData = null;
      this.bed12ExportData = null;
      this.fireIdentifierData = null;

      this.setUpShaderAndTextures(options);

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

    setUpShaderAndTextures(options) {
      // console.log(`setUpShaderAndTextures`);

      // console.log(`setUpShaderAndTextures | ${this.id} | options ${JSON.stringify(options)}`);

      let colorDict = PILEUP_COLORS;

      if (options && options.colorScale && options.colorScale.length == 6) {
        [
          colorDict.A,
          colorDict.T,
          colorDict.G,
          colorDict.C,
          colorDict.N,
          colorDict.X,
        ] = options.colorScale.map((x) => this.colorToArray(x));
      }
      else if (options && options.colorScale && options.colorScale.length == 11) {
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
        ] = options.colorScale.map((x) => this.colorToArray(x));
      } else if (options && options.colorScale){
        console.error("colorScale must contain 6 or 11 entries. See https://github.com/higlass/higlass-pileup#options.")
      }

      // console.log(`this.options.methylationTagColor ${this.options.methylationTagColor}`);
      // if (this.options && this.options.methylationTagColor) {
      //   colorDict.MM = this.colorToArray(this.options.methylationTagColor);
      // }
      if (options && options.methylation && options.methylation.categories && options.methylation.colors) {
        options.methylation.categories.forEach((category, index) => {
          if (category.unmodifiedBase === 'A' && category.code === 'a' && category.strand === '+') {
            colorDict.MM_M6A_FOR = this.colorToArray(options.methylation.colors[index]);
          }
          else if (category.unmodifiedBase === 'T' && category.code === 'a' && category.strand === '-') {
            colorDict.MM_M6A_REV = this.colorToArray(options.methylation.colors[index]);
          }
          else if (category.unmodifiedBase === 'C' && category.code === 'm' && category.strand === '+') {
            colorDict.MM_M5C_FOR = this.colorToArray(options.methylation.colors[index]);
          }
          else if (category.unmodifiedBase === 'G' && category.code === 'm' && category.strand === '-') {
            colorDict.MM_M5C_REV = this.colorToArray(options.methylation.colors[index]);
          }
        });
      }

      if (options && options.methylation && options.methylation.highlights) {
        const highlights = Object.keys(options.methylation.highlights);
        highlights.forEach((highlight) => {
          colorDict[`HIGHLIGHTS_${highlight}`] = this.colorToArray(options.methylation.highlights[highlight]);
        })
      }

      if (options && typeof options.plusStrandColor !== 'undefined') {
        colorDict.PLUS_STRAND = this.colorToArray(options.plusStrandColor);
      }

      if (options && typeof options.minusStrandColor !== 'undefined') {
        colorDict.MINUS_STRAND = this.colorToArray(options.minusStrandColor);
      }

      //
      // add Index DHS color table data, if available
      //
      if (options && options.indexDHS) { 
        const indexDHSColorDict = indexDHSColors(options);
        colorDict = {...colorDict, ...indexDHSColorDict};
        if (options.indexDHS.backgroundColor) {
          // console.log(`[PileupTrack] options.indexDHS.backgroundColor ${options.indexDHS.backgroundColor}`);
          colorDict.INDEX_DHS_BG = this.colorToArray(options.indexDHS.backgroundColor);
        }
      }

      //
      // add FIRE color table data, if available
      //
      if (options && options.fire) { 
        const fireColorDict = fireColors(options);
        colorDict = {...colorDict, ...fireColorDict};
        if (options.fire.metadata && options.fire.metadata.backgroundColor) {
          // console.log(`[PileupTrack] options.fire.metadata.backgroundColor ${options.fire.metadata.backgroundColor}`);
          colorDict.FIRE_BG = this.colorToArray(options.fire.metadata.backgroundColor);
        }
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

    handlePileupTrackViewerMessage(data) {
      // console.log(`data ${JSON.stringify(data)} | ${JSON.stringify(this.options)}`);
      if (data.state === 'mouseover') {
        if (this.id !== data.uid) {
          this.clearMouseOver();
        }
      }
      if (data.state === 'request') {
        switch (data.msg) {
          case "track-updates-freeze":
            this.trackUpdatesAreFrozen = true;
            break;
          case "track-updates-unfreeze":
            this.trackUpdatesAreFrozen = false;
            break;
          case "refresh-layout":
            if (!this.options.methylation || this.trackUpdatesAreFrozen) 
              break;
            // this.dataFetcher = new BAMDataFetcher(
            //   this.dataFetcher.dataConfig,
            //   this.options,
            //   this.worker,
            //   HGC,
            // );
            // this.dataFetcher.track = this;
            for (const key in this.prevRows) {
              for (const row of this.prevRows[key].rows) {
                for (const segment of row) {
                  // console.log(`rerender > segment.id ${segment.id} | ${Object.getOwnPropertyNames(segment)}`);
                  segment.methylationOffsets = [];
                }
              }
            }
            this.prevRows = [];
            this.removeTiles(Object.keys(this.fetchedTiles));
            this.fetching.clear();
            this.refreshTiles();
            this.externalInit(this.options);
            // this.updateExistingGraphics();
            this.prevOptions = Object.assign({}, this.options);
            break;
          case "refresh-fire-layout-post-clustering":
            if (!this.options.fire || this.trackUpdatesAreFrozen)
              break;
            this.dataFetcher = new BAMDataFetcher(
              this.dataFetcher.dataConfig,
              this.options,
              this.worker,
              HGC,
            );
            this.dataFetcher.track = this;
            this.prevRows = [];
            this.removeTiles(Object.keys(this.fetchedTiles));
            this.fetching.clear();
            this.refreshTiles();
            this.externalInit(this.options);
            this.fireIdentifierData = {
              identifiers: data.identifiers,
            };
            this.updateExistingGraphics();
            this.prevOptions = Object.assign({}, this.options);
            break;
          case "cluster-layout":
            if ((!this.options.methylation) || this.clusterData || this.trackUpdatesAreFrozen)
              break;
            this.dataFetcher = new BAMDataFetcher(
              this.dataFetcher.dataConfig,
              this.options,
              this.worker,
              HGC,
            );
            this.dataFetcher.track = this;
            this.prevRows = [];
            this.removeTiles(Object.keys(this.fetchedTiles));
            this.fetching.clear();
            this.refreshTiles();
            this.externalInit(this.options);
            this.clusterData = {
              range: data.range, 
              viewportRange: data.viewportRange,
              method: data.method,
              distanceFn: data.distanceFn,
              eventCategories: data.eventCategories,
              linkage: data.linkage,
              epsilon: data.epsilon,
              minimumPoints: data.minimumPoints,
              probabilityThresholdRange: data.probabilityThresholdRange,
              eventOverlapType: data.eventOverlapType,
              filterFiberMinLength: data.filterFiberMinLength,
              filterFiberMaxLength: data.filterFiberMaxLength,
            };
            this.updateExistingGraphics();
            this.prevOptions = Object.assign({}, this.options);
            break;
          case "bed12-layout":
            if (!this.options.methylation) 
              break;
            const bed12Name = `${this.options.methylation.group}/${this.options.methylation.set}`;
            const bed12Colors = this.options.methylation.colors;
            this.bed12ExportData = {
              range: data.range,
              method: data.method,
              distanceFn: data.distanceFn,
              eventCategories: data.eventCategories,
              linkage: data.linkage,
              epsilon: data.epsilon,
              minimumPoints: data.minimumPoints,
              probabilityThresholdRange: data.probabilityThresholdRange,
              eventOverlapType: data.eventOverlapType,
              uid: this.id,
              name: bed12Name,
              colors: bed12Colors,
            };
            this.exportBED12Layout();
            break;
          default:
            break;
        }
      }
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

      this.setUpShaderAndTextures(options);
      // Reset the following, so the graphic actually updates
      this.previousTileIdsUsedForRendering = {};

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
        this.prevRows = [];
        this.removeTiles(Object.keys(this.fetchedTiles));
        this.fetching.clear();
        this.refreshTiles();
        this.externalInit(options);
      }

      this.updateExistingGraphics();
      this.prevOptions = Object.assign({}, options);
    }

    exportBED12Layout() {
      // console.log(`exportBED12Layout called`);
      this.bc.postMessage({
        state: 'export_bed12_start',
        msg: 'Begin BED12 export worker processing',
        uid: this.id,
      });
      this.worker.then((tileFunctions) => {
        tileFunctions
          .exportSegmentsAsBED12(
            this.dataFetcher.uid,
            Object.values(this.fetchedTiles).map((x) => x.remoteId),
            this._xScale.domain(),
            this._xScale.range(),
            this.position,
            this.dimensions,
            this.prevRows,
            this.options,
            this.bed12ExportData,
          )
          .then((toExport) => {
            // console.log(`toExport ${JSON.stringify(toExport)}`);

            if (this.clusterData) {
              this.clusterData = null;
            }

            if (this.bed12ExportData) {
              this.bed12ExportData = null;
            }

            if (this.fireIdentifierData) {
              this.fireIdentifierData = null;
            }

            this.bc.postMessage({
              state: 'export_bed12_end',
              msg: 'Completed (exportBED12Layout Promise fulfillment)', 
              uid: this.id,
              data: toExport,
            });
          })
      });
    }

    updateExistingGraphics() {
      // console.log(`updateExistingGraphics (start) | ${this.id}`);

      if (this.trackUpdatesAreFrozen) return;
      
      const updateExistingGraphicsStart = performance.now();
      if (!this.maxTileWidthReached) {
        this.loadingText.text = 'Rendering...';
        this.bc.postMessage({
          state: 'update_start', 
          msg: this.loadingText.text,
          uid: this.id,
        });
      } 
      else {
        // console.log(`updateExistingGraphics (A) | ${this.id}`);
        this.worker.then((tileFunctions) => {
          tileFunctions
            .renderSegments(
              this.dataFetcher.uid,
              Object.values(this.fetchedTiles).map((x) => x.remoteId),
              this._xScale.domain(),
              this._xScale.range(),
              this.position,
              this.dimensions,
              this.prevRows,
              this.options,
              this.clusterData,
              this.fireIdentifierData,
            )
            .then((toRender) => {
              // console.log(`toRender (maxTileWidthReached) ${JSON.stringify(toRender)}`);
              
              if (
                this.segmentGraphics
              ) {
                this.pMain.removeChild(this.segmentGraphics);
              }
              this.draw();
              this.animate();
              const updateExistingGraphicsEndA = performance.now();
              const elapsedTimeA = updateExistingGraphicsEndA - updateExistingGraphicsStart;
              const msg = {
                state: 'update_end', 
                msg: 'Completed (maxTileWidthReached)', 
                uid: this.id, 
                elapsedTime: elapsedTimeA,
              };
              // console.log(`${JSON.stringify(msg)}`);
              this.bc.postMessage(msg);
            });
        });
        return;
      }

      // console.log(`updateExistingGraphics (B1) | ${this.id}`);
      const fetchedTileIds = new Set(Object.keys(this.fetchedTiles));
      if (!eqSet(this.visibleTileIds, fetchedTileIds)) {
        this.updateLoadingText();
        return;
      }

      // Prevent multiple renderings with the same tiles. This can happen when multiple new tiles come in at once
      // console.log(`updateExistingGraphics (B2) | ${this.id}`);
      if (eqSet(this.previousTileIdsUsedForRendering, fetchedTileIds)) {
        return;
      }
      this.previousTileIdsUsedForRendering = fetchedTileIds;
      // console.log(`updateExistingGraphics (B2+) | ${this.id}`);

      const fetchedTileKeys = Object.keys(this.fetchedTiles);

      for (const fetchedTileKey of fetchedTileKeys) {
        this.fetching.delete(fetchedTileKey);
        this.rendering.add(fetchedTileKey);
      }
      // fetchedTileKeys.forEach((x) => {
      //   this.fetching.delete(x);
      //   this.rendering.add(x);
      // });

      this.updateLoadingText();

      // console.log(`updateExistingGraphics (B3) | ${this.id}`);
      
      this.worker.then((tileFunctions) => {
        tileFunctions
          .renderSegments(
            this.dataFetcher.uid,
            Object.values(this.fetchedTiles).map((x) => x.remoteId),
            this._xScale.domain(),
            this._xScale.range(),
            this.position,
            this.dimensions,
            this.prevRows,
            this.options,
            this.clusterData,
            this.fireIdentifierData,
          )
          .then((toRender) => {
            // console.log(`toRender.tileIds ${JSON.stringify(toRender.tileIds)}`);

            if (!toRender)
              return;

            if (toRender.clusterResultsToExport) {
              this.bc.postMessage({
                state: 'export_subregion_clustering_results',
                msg: 'Completed subregion clustering', 
                uid: this.id,
                data: toRender.clusterResultsToExport,
              });
              // console.log(`export_subregion_clustering_end | ${this.id} | ${toRender.clusterResultsToExport}`);
            }

            this.loadingText.visible = false;

            for (const fetchedTileKey of fetchedTileKeys) {
              this.rendering.delete(fetchedTileKey);
            }
            // fetchedTileKeys.forEach((x) => {
            //   this.rendering.delete(x);
            // });

            this.updateLoadingText();

            if (this.maxTileWidthReached) {
              // if (
              //   this.segmentGraphics &&
              //   this.options.collapseWhenMaxTileWidthReached
              // ) {
              //   this.pMain.removeChild(this.segmentGraphics);
              // }
              if (this.segmentGraphics) {
                this.segmentGraphics.clear();
                this.pMain.removeChild(this.segmentGraphics);
                this.pBorder.clear();
              }
              if (this.mouseOverGraphics) {
                requestAnimationFrame(this.animate);
                this.mouseOverGraphics.clear();
                this.pMain.removeChild(this.mouseOverGraphics);
                this.pBorder.clear();
              }
              this.loadingText.visible = false;
              this.draw();
              this.animate();
              requestAnimationFrame(this.animate);
              
              const updateExistingGraphicsEndB = performance.now();
              const elapsedTimeB = updateExistingGraphicsEndB - updateExistingGraphicsStart;
              const msg = {
                state: 'update_end', 
                msg: 'Completed (maxTileWidthReached)', 
                uid: this.id, 
                elapsedTime: elapsedTimeB,
              };
              // console.log(`${JSON.stringify(msg)}`);
              this.bc.postMessage(msg);

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

            this.prevRows = toRender.rows;
            this.coverage = toRender.coverage;
            this.coverageSamplingDistance = toRender.coverageSamplingDistance;

            if (this.loadMates) {
              this.readsById = {};
              for (let key in this.prevRows) {

                for (const row of this.prevRows[key].rows) {
                  for (const segment of row) {
                    if (segment.id in this.readsById) return;
                    this.readsById[segment.id] = segment;
                    this.readsById[segment.id]['groupKey'] = key;
                  }
                }
                // this.prevRows[key].rows.forEach((row) => {
                //   row.forEach((segment) => {
                //     if (segment.id in this.readsById) return;
                //     this.readsById[segment.id] = segment;
                //     // Will be needed later in the mouseover to determine the correct yPos for the mate
                //     this.readsById[segment.id]['groupKey'] = key;
                //   });
                // });
              }
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
            for (let key in this.prevRows) {
              this.yScaleBands[key] = HGC.libraries.d3Scale
                .scaleBand()
                .domain(
                  HGC.libraries.d3Array.range(
                    0,
                    this.prevRows[key].rows.length,
                  ),
                )
                .range([this.prevRows[key].start, this.prevRows[key].end])
                .paddingInner(0.2);
            }

            this.drawnAtScale = HGC.libraries.d3Scale
              .scaleLinear()
              .domain(toRender.xScaleDomain)
              .range(toRender.xScaleRange);

            scaleScalableGraphics(
              this.segmentGraphics,
              this._xScale,
              this.drawnAtScale,
            );

            // if somebody zoomed vertically, we want to readjust so that
            // they're still zoomed in vertically
            this.segmentGraphics.scale.y = this.valueScaleTransform.k;
            this.segmentGraphics.position.y = this.valueScaleTransform.y;

            this.draw();
            this.animate();

            if (this.clusterData) {
              this.clusterData = null;
            }

            if (this.bed12ExportData) {
              this.bed12ExportData = null;
            }

            if (this.fireIdentifierData) {
              this.fireIdentifierData = null;
            }

            const updateExistingGraphicsEndC = performance.now();
            const elapsedTimeC = updateExistingGraphicsEndC - updateExistingGraphicsStart;
            const msg = {
              state: 'update_end', 
              msg: 'Completed (renderSegments Promise fulfillment)', 
              uid: this.id,
              elapsedTime: elapsedTimeC,
            };
            // console.log(`${JSON.stringify(msg)}`);
            // this.bc.postMessage(msg);
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

      if (this.maxTileWidthReached) return;

      if (!this.tilesetInfo) {
        this.loadingText.text = 'Fetching tileset info...';
        this.bc.postMessage({state: 'fetching_tileset_info', msg: this.loadingText.text,  uid: this.id});
        return;
      }

      if (this.fetching.size) {
        this.loadingText.text = `Fetching... ${[...this.fetching]
          .map((x) => x.split('|')[0])
          .join(' ')}`;
        this.bc.postMessage({state: 'fetching', msg: this.loadingText.text,  uid: this.id});
      }

      if (this.rendering.size) {
        this.loadingText.text = `Rendering... ${[...this.rendering].join(' ')}`;
        this.bc.postMessage({state: 'rendering', msg: this.loadingText.text,  uid: this.id});
      }

      if (!this.fetching.size && !this.rendering.size && this.tilesetInfo) {
        this.loadingText.visible = false;
        // this.bc.postMessage({state: 'update_end', msg: 'Completed',  uid: this.id});
      }
    }

    draw() {
      // const valueScale = HGC.libraries.d3Scale
      //   .scaleLinear()
      //   .domain([0, this.prevRows.length])
      //   .range([0, this.dimensions[1]]);
      // HGC.utils.trackUtils.drawAxis(this, valueScale);
      this.trackNotFoundText.text = 'Track not found';
      this.trackNotFoundText.visible = true;
    }

    indexDHSElementCategory(colormap, rgb) {
      return `<div style="display:inline-block; position:relative; top:-2px;">
        <svg width="10" height="10">
          <rect width="10" height="10" rx="2" ry="2" style="fill:rgb(${rgb});stroke:black;stroke-width:2;" />
        </svg>
        <span style="position:relative; top:1px; font-weight:600;">${colormap[rgb]}</span>
      </div>`;
    }

    indexDHSElementCartoon(elementStart, elementEnd, rgb, subs, summitStart, summitEnd, elementId) {
      let elementCartoon = '';
      const elementCartoonWidth = 200;
      const elementCartoonGeneHeight = 30;
      const elementCartoonHeight = elementCartoonGeneHeight + 10;
      const elementCartoonMiddle = elementCartoonHeight / 2;
      function pos2pixel(pos) {
        return ((pos - elementStart) / ((elementEnd - elementStart) * 1.0)) * elementCartoonWidth;
      }
      let blockCount = 0;
      let blockStarts = [];
      let blockSizes = [];
      for (const sub of subs) {
        if (sub.type === 'M') {
          blockCount++;
          blockStarts.push(sub.pos);
          blockSizes.push(sub.length);
        }
      }
      if (blockCount > 0) {
        elementCartoon += `<svg width="${elementCartoonWidth}" height="${elementCartoonHeight}">
          <style type="text/css">
            .ticks {stroke:rgb(${rgb});stroke-width:1px;fill:none;}
            .gene {stroke:rgb(${rgb});stroke-width:1px;fill:none;}
            .translate { fill:rgb(${rgb});fill-opacity:1;}
            .exon { fill:rgb(${rgb});fill-opacity:1;}
            .score { fill:rgb(${rgb});fill-opacity:1;font:bold 12px sans-serif;}
            .id { fill:rgb(${rgb});fill-opacity:1;font:bold 12px sans-serif;}
          </style>
          <defs>
            <path id="ft" class="ticks" d="m -3 -3  l 3 3  l -3 3" />
            <path id="rt" class="ticks" d="m 3 -3  l -3 3  l 3 3" />
          </defs>
        `;
        const isElementBarPlotLike = true;
        const ecStart = pos2pixel(elementStart);
        const ecEnd = pos2pixel(elementEnd);
        elementCartoon += `<line class="gene" x1=${ecStart} x2=${ecEnd} y1=${elementCartoonMiddle} y2=${elementCartoonMiddle} />`;
        const ecThickStart = pos2pixel(summitStart);
        const ecThickEnd = pos2pixel(summitEnd);
        const ecThickY = elementCartoonMiddle - elementCartoonGeneHeight / 4;
        const ecThickHeight = elementCartoonGeneHeight / 2;
        let ecThickWidth = ecThickEnd - ecThickStart;
        if (isElementBarPlotLike) {
          ecThickWidth = ecThickWidth !== 1 ? 1 : ecThickWidth;
        }
        let realIdTextAnchor = '';
        if (ecThickStart < 0.15 * elementCartoonWidth) {
          realIdTextAnchor = 'start';
        } else if (
          ecThickStart >= 0.15 * elementCartoonWidth &&
          ecThickStart <= 0.85 * elementCartoonWidth
        ) {
          realIdTextAnchor = 'middle';
        } else {
          realIdTextAnchor = 'end';
        }
        elementCartoon += `<rect class="translate" x=${ecThickStart} y=${ecThickY} width=${ecThickWidth} height=${ecThickHeight} />`;
        const ecLabelDy = '-0.25em';
        elementCartoon += `<text class="id" text-anchor="${realIdTextAnchor}" x=${ecThickStart} y=${ecThickY} dy=${ecLabelDy}>${elementId}</text>`;

        let ecExonStart = 0;
        let ecExonWidth = 0;
        const ecExonY = elementCartoonMiddle - elementCartoonGeneHeight / 8;
        const ecExonHeight = elementCartoonGeneHeight / 4;
        for (let i = 0; i < blockCount; i++) {
          ecExonStart = pos2pixel(elementStart + +blockStarts[i]);
          ecExonWidth = pos2pixel(elementStart + +blockSizes[i]);
          elementCartoon += `<rect class="exon" x=${ecExonStart} y=${ecExonY} width=${ecExonWidth} height=${ecExonHeight} />`;
        }
        // add whiskers separately
        if (isElementBarPlotLike) {
          // leftmost whisker
          ecExonStart = ecStart;
          ecExonWidth = ecStart + 1;
          elementCartoon += `<rect class="exon" x=${ecExonStart} y=${ecExonY} width=${ecExonWidth} height=${ecExonHeight} />`;
          // rightmost whisker
          ecExonStart = ecEnd - 1;
          ecExonWidth = ecEnd;
          elementCartoon += `<rect class="exon" x=${ecExonStart} y=${ecExonY} width=${ecExonWidth} height=${ecExonHeight} />`;
        }

        elementCartoon += '</svg>';
      }
      return elementCartoon;
    }

    clearMouseOver() {
      this.mouseOverGraphics.clear();
      requestAnimationFrame(this.animate);
    }

    getMouseOverHtml(trackX, trackYIn) {
      if (this.maxTileWidthReached) return;

      // const trackY = this.valueScaleTransform.invert(track)
      this.mouseOverGraphics.clear();
      // Prevents 'stuck' read outlines when hovering quickly
      requestAnimationFrame(this.animate);

      const msg = {
        state: 'mouseover', 
        msg: 'mouseover event', 
        uid: this.id,
      };
      this.monitor.postMessage(msg);

      const trackY = invY(trackYIn, this.valueScaleTransform);

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
            const { rows } = this.prevRows[key];

            if (index >= 0 && index < rows.length) {
              const row = rows[index];

              for (const read of row) {
                const readTrackFrom = this._xScale(read.from);
                const readTrackTo = this._xScale(read.to);

                if (readTrackFrom <= trackX && trackX <= readTrackTo) {
                  const xPos = this._xScale(read.from);
                  const yPos = transformY(
                    yScaleBand(index),
                    this.valueScaleTransform,
                  );

                  const MAX_DIST = 10;
                  const nearestDistance =
                    this._xScale.invert(MAX_DIST) - this._xScale.invert(0);

                  const mousePos = this._xScale.invert(trackX);
                  // find the nearest substitution (or indel)
                  const nearestSub = findNearestSub(
                    mousePos,
                    read,
                    nearestDistance,
                  );

                  if (this.options.outlineReadOnHover) {
                    const width =
                      this._xScale(read.to) - this._xScale(read.from);
                    const height =
                      yScaleBand.bandwidth() * this.valueScaleTransform.k;

                    this.mouseOverGraphics.lineStyle({
                      width: 1,
                      color: 0,
                    });
                    this.mouseOverGraphics.drawRect(xPos, yPos, width, height);
                    this.animate();
                  }

                  if (this.options.outlineMateOnHover) {
                    this.outlineMate(read, yScaleBand);
                  }

                  const insertSizeHtml = this.getInsertSizeMouseoverHtml(read);
                  const chimericReadHtml = read.mate_ids.length > 1 ? `<span style="color:red;">Chimeric alignment</span><br>`: ``;

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

                  // let mouseOverHtml =
                  //   `Name: ${read.readName}<br>` +
                  //   `Position: ${read.chrName}:${
                  //     read.from - read.chrOffset
                  //   }<br>` +
                  //   `Read length: ${read.to - read.from}<br>` +
                  //   `MAPQ: ${read.mapq}<br>` +
                  //   `Strand: ${read.strand}<br>` +
                  //   insertSizeHtml +
                  //   chimericReadHtml +
                  //   mappingOrientationHtml;

                  // if (nearestSub && nearestSub.type) {
                  //   mouseOverHtml += `Nearest operation: ${cigarTypeToText(
                  //     nearestSub.type,
                  //   )} (${nearestSub.length})`;
                  // } else if (nearestSub && nearestSub.variant) {
                  //   mouseOverHtml += `Nearest operation: ${nearestSub.base} &rarr; ${nearestSub.variant}`;
                  // }

                  const dataX = this._xScale.invert(trackX);
                  let positionText = null;
                  let eventText = null;
                  let eventProbability = null;
                  if (this.options.chromInfo) {
                    const atcX = HGC.utils.absToChr(dataX, this.options.chromInfo);
                    const chrom = atcX[0];
                    const position = Math.ceil(atcX[1]);
                    positionText = `${chrom}:${position}`;
                    const methylationOffset = position - (read.from - read.chrOffset);
                    for (const mo of read.methylationOffsets) {
                      const moQuery = mo.offsets.indexOf(methylationOffset);
                      if (moQuery !== -1) {
                        // console.log(`mo @ ${methylationOffset} ${moQuery} | ${mo.unmodifiedBase} ${mo.strand} ${mo.probabilities[moQuery]}`);
                        eventText = ((mo.unmodifiedBase === 'A') || (mo.unmodifiedBase === 'T')) ? 'm6A' : '5mC';
                        eventProbability = parseInt(mo.probabilities[moQuery]);
                        if (eventProbability < this.options.methylation.probabilityThresholdRange[0]) {
                          eventProbability = null;
                        }
                        break;
                      }
                    }
                  }

                  let output = `<div class="track-mouseover-menu-table">`;

                  if (positionText) {
                    output += `
                    <div class="track-mouseover-menu-table-item">
                      <label for="position" class="track-mouseover-menu-table-item-label">Position</label>
                      <div name="position" class="track-mouseover-menu-table-item-value">${positionText}</div>
                    </div>
                    `;
                  }

                  if (eventText && eventProbability) {
                    output += `
                    <div class="track-mouseover-menu-table-item">
                      <label for="eventType" class="track-mouseover-menu-table-item-label">Event</label>
                      <div name="eventType" class="track-mouseover-menu-table-item-value">${eventText}</div>
                    </div>
                    <div class="track-mouseover-menu-table-item">
                      <label for="eventProbability" class="track-mouseover-menu-table-item-label">Probability (ML)</label>
                      <div name="eventProbability" class="track-mouseover-menu-table-item-value">${eventProbability}</div>
                    </div>
                    `;
                  }

                  // let cellLineText = null;
                  // if (this.options.methylation && this.options.methylation.group && this.options.methylation.set) {
                  //   groupText = `${this.options.methylation.group}/${this.options.methylation.set}`;
                  //   if (this.options.methylation.haplotype) {
                  //     groupText += ` (${this.options.methylation.haplotype})`;
                  //   }
                  // }

                  // let cellLineText = null;
                  // if (this.options.methylation && this.options.methylation.group) {
                  //   cellLineText = `${this.options.methylation.group}`;
                  // }

                  // if (cellLineText) {
                  //   output += `
                  //   <div class="track-mouseover-menu-table-item">
                  //     <label for="cell_line" class="track-mouseover-menu-table-item-label">Cell line</label>
                  //     <div name="cell_line" class="track-mouseover-menu-table-item-value">${cellLineText}</div>
                  //   </div>
                  //   `;
                  // }

                  // let conditionText = null;
                  // if (this.options.methylation && this.options.methylation.set) {
                  //   conditionText = `${this.options.methylation.set}`;
                  // }

                  // if (conditionText) {
                  //   output += `
                  //   <div class="track-mouseover-menu-table-item">
                  //     <label for="condition" class="track-mouseover-menu-table-item-label">Condition</label>
                  //     <div name="condition" class="track-mouseover-menu-table-item-value">${conditionText}</div>
                  //   </div>
                  //   `;
                  // }

                  // let donorText = null;
                  // if (this.options.methylation && this.options.methylation.donor) {
                  //   donorText = `${this.options.methylation.donor}`;
                  // }

                  // if (donorText) {
                  //   output += `
                  //   <div class="track-mouseover-menu-table-item">
                  //     <label for="donor" class="track-mouseover-menu-table-item-label">Donor</label>
                  //     <div name="donor" class="track-mouseover-menu-table-item-value">${donorText}</div>
                  //   </div>
                  //   `;
                  // }

                  // let haplotypeText = null;
                  // if (this.options.methylation && this.options.methylation.haplotype) {
                  //   haplotypeText = `${this.options.methylation.haplotype}`;
                  // }

                  // if (haplotypeText) {
                  //   output += `
                  //   <div class="track-mouseover-menu-table-item">
                  //     <label for="haplotype" class="track-mouseover-menu-table-item-label">Haplotype</label>
                  //     <div name="haplotype" class="track-mouseover-menu-table-item-value">${haplotypeText}</div>
                  //   </div>
                  //   `;
                  // }

                  if (this.options.indexDHS) {
                    const readNameLabel = 'Index DHS';
                    const readNameValue = `${read.readName} | ${this.options.name}`;
                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readName" class="track-mouseover-menu-table-item-label">${readNameLabel}</label>
                      <div name="readName" class="track-mouseover-menu-table-item-value">${readNameValue}</div>
                    </div>`;
                  }
                  else {
                    const readNameLabel = 'Name';
                    const readNameValue = read.readName;
                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readName" class="track-mouseover-menu-table-item-label">${readNameLabel}</label>
                      <div name="readName" class="track-mouseover-menu-table-item-value">${readNameValue}</div>
                    </div>`;
                  }

                  const readIntervalLabel = (this.options.methylation) ? 'Interval' : (this.options.indexDHS) ? 'Range' : 'Interval';
                  let readIntervalValue = `${read.chrName}:${read.from - read.chrOffset}-${read.to - read.chrOffset - 1}`;
                  readIntervalValue += (this.options.methylation) ? ` (${read.strand})` : '';
                  output += `<div class="track-mouseover-menu-table-item">
                    <label for="readInterval" class="track-mouseover-menu-table-item-label">${readIntervalLabel}</label>
                    <div name="readInterval" class="track-mouseover-menu-table-item-value">${readIntervalValue}</div>
                  </div>`;

                  if (this.options.methylation) {
                    const readLength = `${read.to - read.from}`;
                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readLength" class="track-mouseover-menu-table-item-label">Length</label>
                      <div name="readLength" class="track-mouseover-menu-table-item-value">${readLength}</div>
                    </div>`;
                  }

                  if (this.options.indexDHS) {
                    const metadata = read.metadata;
                    // const realId = metadata.dhs.id;
                    const elementSummit = `${read.chrName}:${parseInt(metadata.summit.start + (metadata.summit.end - metadata.summit.start)/2)}`;
                    const elementScorePrecision = 4;
                    const elementScore = Number.parseFloat(metadata.dhs.score).toPrecision(elementScorePrecision);
                    const elementBiosampleCount = Number.parseInt(metadata.dhs.n);

                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readSummit" class="track-mouseover-menu-table-item-label">Summit</label>
                      <div name="readSummit" class="track-mouseover-menu-table-item-value">${elementSummit}</div>
                    </div>`;

                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readScore" class="track-mouseover-menu-table-item-label">Score</label>
                      <div name="readScore" class="track-mouseover-menu-table-item-value">${elementScore}</div>
                    </div>`;

                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readCategory" class="track-mouseover-menu-table-item-label">Category</label>
                      <div name="readCategory" class="track-mouseover-menu-table-item-value">${this.indexDHSElementCategory(this.options.indexDHS.itemRGBMap, metadata.rgb)}</div>
                    </div>`;

                    const indexDHSStart = read.from - read.chrOffset;
                    const indexDHSEnd = read.to - read.chrOffset - 1;
                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readStructure" class="track-mouseover-menu-table-item-label">Structure</label>
                      <div name="readStructure" class="track-mouseover-menu-table-item-value track-mouseover-menu-table-item-value-svg">${this.indexDHSElementCartoon(indexDHSStart, indexDHSEnd, metadata.rgb, read.substitutions, metadata.summit.start, metadata.summit.end, metadata.dhs.id)}</div>
                    </div>`;

                    output += `<div class="track-mouseover-menu-table-item">
                      <label for="readSamples" class="track-mouseover-menu-table-item-label">Samples</label>
                      <div name="readSamples" class="track-mouseover-menu-table-item-value">Found in <span style="font-weight: 900; padding-left:5px; padding-right:5px;">${elementBiosampleCount}</span> / ${this.options.indexDHS.biosampleCount} biosamples</div>
                    </div>`;
                  }

                  // if (nearestSub && nearestSub.type) {
                  //   const readNearestOp = `${nearestSub.length}${cigarTypeToText(nearestSub.type)}`;
                  //   output += `<div class="track-mouseover-menu-table-item">
                  //     <label for="readNearestOp" class="track-mouseover-menu-table-item-label">Nearest op</label>
                  //     <div name="readNearestOp" class="track-mouseover-menu-table-item-value">${readNearestOp}</div>
                  //   </div>`;
                  // }
                  // else if (nearestSub && nearestSub.variant) {
                  //   const readNearestOp = `${nearestSub.length} (${nearestSub.variant})`;
                  //   output += `<div class="track-mouseover-menu-table-item">
                  //     <label for="readNearestOp" class="track-mouseover-menu-table-item-label">Nearest op</label>
                  //     <div name="readNearestOp" class="track-mouseover-menu-table-item-value">${readNearestOp}</div>
                  //   </div>`;
                  // }

                  output += `</div>`;

                  return output;
                  // + `CIGAR: ${read.cigar || ''} MD: ${read.md || ''}`);
                }
              }
            }
          }
        }

        // var val = self.yScale.domain()[index];
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

            for (let variant of Object.keys(readCount.variants)) {
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

    getInsertSizeMouseoverHtml(read){
      let insertSizeHtml = ``;
      if (
        this.options.highlightReadsBy.includes('insertSize') ||
        this.options.highlightReadsBy.includes(
          'insertSizeAndPairOrientation',
        )
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
            ('largeInsertSizeThreshold' in this.options && insertSize > this.options.largeInsertSizeThreshold) ||
            ('smallInsertSizeThreshold' in this.options && insertSize < this.options.smallInsertSizeThreshold)
          ) {
            const color = Object.keys(PILEUP_COLORS)[read.colorOverride || read.color];
            const htmlColor = this.colorArrayToString(PILEUP_COLORS[color]);
            style = `style="color:${htmlColor};"`;
          } 
          insertSizeHtml = `Insert size: <span ${style}>${insertSize}</span><br>`;
        }
      }
      return insertSizeHtml;
    }

    outlineMate(read, yScaleBand){
      for (const mate_id of read.mate_ids) {
        if (!this.readsById[mate_id]) {
          return;
        }
        const mate = this.readsById[mate_id];
        // We assume the mate height is the same, but width might be different
        const mate_width =
          this._xScale(mate.to) - this._xScale(mate.from);
        const mate_height =
          yScaleBand.bandwidth() * this.valueScaleTransform.k;
        const mate_xPos = this._xScale(mate.from);
        const mate_yPos = transformY(
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
      }      
      // read.mate_ids.forEach((mate_id) => {
      //   if (!this.readsById[mate_id]) {
      //     return;
      //   }
      //   const mate = this.readsById[mate_id];
      //   // We assume the mate height is the same, but width might be different
      //   const mate_width =
      //     this._xScale(mate.to) - this._xScale(mate.from);
      //   const mate_height =
      //     yScaleBand.bandwidth() * this.valueScaleTransform.k;
      //   const mate_xPos = this._xScale(mate.from);
      //   const mate_yPos = transformY(
      //     this.yScaleBands[mate.groupKey](mate.row),
      //     this.valueScaleTransform,
      //   );
      //   this.mouseOverGraphics.lineStyle({
      //     width: 1,
      //     color: 0,
      //   });
      //   this.mouseOverGraphics.drawRect(
      //     mate_xPos,
      //     mate_yPos,
      //     mate_width,
      //     mate_height,
      //   );
      // });
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

        if (
          tileWidth >
          (this.tilesetInfo.max_tile_width ||
            (this.dataFetcher.dataConfig.options &&
              this.dataFetcher.dataConfig.options.maxTileWidth) ||
            this.options.maxTileWidth ||
            DEFAULT_MAX_TILE_WIDTH)
        ) {
          if (this.options.collapseWhenMaxTileWidthReached) {
            this.pubSub.publish('trackDimensionsModified', {
              height: 20,
              resizeParentDiv: true,
              trackId: this.trackId,
              viewId: this.viewId,
            });
          }

          this.errorTextText = (this.dataFetcher.dataConfig.options && this.dataFetcher.dataConfig.options.maxTileWidthReachedMessage) ? this.dataFetcher.dataConfig.options.maxTileWidthReachedMessage : "Zoom in to load data";
          this.drawError();
          this.animate();
          this.maxTileWidthReached = true;

          const msg = {state: 'update_end', msg: 'Completed (calculateVisibleTiles)',  uid: this.id};
          // console.log(`${JSON.stringify(msg)}`);
          this.bc.postMessage(msg);

          return;
        } else {
          this.maxTileWidthReached = false;

          if (this.options.collapseWhenMaxTileWidthReached) {
            this.pubSub.publish('trackDimensionsModified', {
              height: this.originalHeight,
              resizeParentDiv: true,
              trackId: this.trackId,
              viewId: this.viewId,
            });
          }
        }

        this.errorTextText = null;
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
      const height = this.dimensions[1];

      // clamp at the bottom and top
      if (
        vst.y + dY / vst.k > -(vst.k - 1) * height &&
        vst.y + dY / vst.k < 0
      ) {
        this.valueScaleTransform = vst.translate(0, dY / vst.k);
      }

      // this.segmentGraphics may not have been initialized if the user
      // was zoomed out too far
      if (this.segmentGraphics) {
        this.segmentGraphics.position.y = this.valueScaleTransform.y;
      }

      this.animate();
    }

    zoomedY(yPos, kMultiplier) {
      const newTransform = HGC.utils.trackUtils.zoomedY(
        yPos,
        kMultiplier,
        this.valueScaleTransform,
        this.dimensions[1],
      );

      this.valueScaleTransform = newTransform;
      this.segmentGraphics.scale.y = newTransform.k;
      this.segmentGraphics.position.y = newTransform.y;

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

      this.clearMouseOver();

      if (super.exportSVG) {
        [base, track] = super.exportSVG();
      } else {
        base = document.createElement('g');
        track = base;
      }

      this.mouseOverGraphics.clear();
      this.animate();

      // base = document.createElement('g');
      // track = base;

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
    // 'minZoom',
    'showLoadingText',
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
    showLoadingText: false,
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
          value: [
            "insertSize"
          ],
          name: 'Insert size',
        },
        pairOrientation: {
          value: [
            "pairOrientation"
          ],
          name: 'Pair orientation',
        },
        insertSizeAndPairOrientation: {
          value: [
            "insertSizeAndPairOrientation"
          ],
          name: 'Insert size and pair orientation',
        },
        insertSizeOrPairOrientation: {
          value: [
            "insertSize",
            "pairOrientation"
          ],
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
      },
    },
  },
};

export default PileupTrack;
