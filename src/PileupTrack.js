import BAMDataFetcher from './bam-fetcher';
import { spawn, Worker } from 'threads';

const shader = PIXI.Shader.from(`

    attribute vec2 position;
    attribute vec4 aColor;

    uniform mat3 projectionMatrix;
    uniform mat3 translationMatrix;

    varying vec4 vColor;

    void main(void)
    {
        vColor = aColor;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
    }

`,
`
varying vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`);

/**
 * Get the location of this script so that we can use it to fetch
 * the worker script.
 *
 * @return {String}         The url of this script
 */
function getThisScriptLocation() {
  const scripts = [...document.getElementsByTagName('script')];
  for (const script of scripts) {
    const parts = script.src.split('/');

    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];

      if (lastPart.indexOf('higlass-pileup') >= 0) {
        return parts.slice(0, parts.length - 1).join('/');
      }
    }
  }
}

const scaleScalableGraphics = (graphics, xScale, drawnAtScale) => {
  const tileK = (drawnAtScale.domain()[1] - drawnAtScale.domain()[0])
    / (xScale.domain()[1] - xScale.domain()[0]);
  const newRange = xScale.domain().map(drawnAtScale);

  const posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};

const getTilePosAndDimensions = (zoomLevel, tilePos, binsPerTileIn, tilesetInfo) => {
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
      .map(x => +x)
      .sort((a, b) => b - a);

    const chosenResolution = sortedResolutions[zoomLevel];

    const tileWidth = chosenResolution * binsPerTile;
    const tileHeight = tileWidth;

    const tileX = chosenResolution * binsPerTile * tilePos[0];
    const tileY = chosenResolution * binsPerTile * tilePos[1];

    return {
      tileX, tileY, tileWidth, tileHeight
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

const PileupTrack = (HGC, ...args) => {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"',
    );
  }

  class PileupTrackClass extends HGC.tracks.Tiled1DPixiTrack {
    constructor(context, options) {
      const worker = spawn(
        new Worker('./bam-fetcher-worker.js',
          { _baseURL: `${getThisScriptLocation()}/` }),
      );

      // this is where the threaded tile fetcher is called
      context.dataFetcher = new BAMDataFetcher(
        context.dataConfig,
        worker,
        HGC,
      );

      super(context, options);

      this.worker = worker;
      this.valueScaleTransform = HGC.libraries.d3Zoom.zoomIdentity;


      // we scale the entire view up until a certain point
      // at which point we redraw everything to get rid of
      // artifacts
      // this.drawnAtScale keeps track of the scale at which
      // we last rendered everything
      this.drawnAtScale = HGC.libraries.d3Scale.scaleLinear();
      this.prevRows = [];

      // graphics for highliting reads under the cursor
      this.mouseOverGraphics = new HGC.libraries.PIXI.Graphics();
    }

    rerender() {
      this.updateExistingGraphics();
    }

    updateExistingGraphics() {
      this.worker.then((tileFunctions) => {
        tileFunctions.renderSegments(
          this.dataFetcher.uid,
          Object.keys(this.fetchedTiles),
          this._xScale.domain(),
          this._xScale.range(),
          this.position,
          this.dimensions,
          this.prevRows,
        ).then((toRender) => {
          this.errorTextText = null;
          this.pBorder.clear();
          this.drawError();
          this.animate();

          const positions = new Float32Array(toRender.positionsBuffer);
          const colors = new Float32Array(toRender.colorsBuffer);

          const newGraphics = new HGC.libraries.PIXI.Graphics();

          this.prevRows = toRender.rows;

          const geometry = new HGC.libraries.PIXI.Geometry()
            .addAttribute('position', positions, 2);// x,y
          geometry.addAttribute('aColor', colors, 4);

          const state = new HGC.libraries.PIXI.State();
          const mesh = new HGC.libraries.PIXI.Mesh(geometry, shader, state);

          newGraphics.addChild(mesh);
          this.pMain.x = this.position[0];

          if (this.segmentGraphics) {
            this.pMain.removeChild(this.segmentGraphics);
          }

          this.pMain.addChild(newGraphics);
          this.segmentGraphics = newGraphics;

          this.yScaleBand = HGC.libraries.d3Scale.scaleBand()
            .domain(HGC.libraries.d3Array.range(0, this.prevRows.length))
            .range([this.position[1], this.position[1] + this.dimensions[1]])
            .paddingInner(0.2);
          this.drawnAtScale = HGC.libraries.d3Scale.scaleLinear()
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
        }).catch((err) => {
          // console.log('err:', err);
          // console.log('err:', err.message);
          this.errorTextText = err.message;

          // console.log('errorTextText:', this.errorTextText);
          // this.draw();
          // this.animate();
          this.drawError();
          this.animate();

          // console.log('this.pBorder:', this.pBorder);
        });
      });
    }

    getMouseOverHtml(trackX, trackY) {
      if (this.yScaleBand) {
        const eachBand = this.yScaleBand.step();
        const index = Math.round((trackY / eachBand));


        if (index >= 0 && index < this.prevRows.length) {
          const row = this.prevRows[index];

          for (const read of row) {
            const readTrackFrom = this._xScale(read.from);
            const readTrackTo = this._xScale(read.to);

            if (readTrackFrom <= trackX && trackX <= readTrackTo) {
              return (`Position: ${read.chrName}:${read.from - read.chrOffset}<br>`
                + `Read length: ${read.to - read.from}<br>`
                + `CIGAR: ${read.cigar || ''} MD: ${read.md || ''}`);
            }
          }
        }
        // var val = self.yScale.domain()[index];
      }

      return '';
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
          tile[0], [tile[1]], this.tilesetInfo.tile_size, this.tilesetInfo,
        );

        if (tileWidth > this.tilesetInfo.max_tile_width) {
          this.errorTextText = 'Zoom in to see details';
          this.drawError();
          this.animate();
          return;
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
    }

    movedY(dY) {
      const vst = this.valueScaleTransform;
      const height = this.dimensions[1];

      // clamp at the bottom and top
      if (
        vst.y + (dY / vst.k) > -(vst.k - 1) * height
        && vst.y + (dY / vst.k) < 0
      ) {
        this.valueScaleTransform = vst.translate(
          0, dY / vst.k,
        );
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
        yPos, kMultiplier,
        this.valueScaleTransform,
        this.dimensions[1],
      );

      this.valueScaleTransform = newTransform;
      this.segmentGraphics.scale.y = newTransform.k;
      this.segmentGraphics.position.y = newTransform.y;

      this.animate();
    }

    zoomed(newXScale, newYScale) {
      super.zoomed(newXScale, newYScale);

      if (this.segmentGraphics) {
        scaleScalableGraphics(this.segmentGraphics, newXScale, this.drawnAtScale);
      }
    }
  }

  return new PileupTrackClass(...args);
};

const icon = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';

PileupTrack.config = {
  type: 'pileup',
  datatype: ['reads'],
  orientation: '1d-horizontal',
  name: 'Pileup Track',
  thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
  availableOptions: [
    'axisPositionHorizontal',
    'axisLabelFormatting',
    // 'minZoom'
  ],
  defaultOptions: {
    // minZoom: null,
    axisPositionHorizontal: 'right',
    axisLabelFormatting: 'normal',
  },
};

export default PileupTrack;
