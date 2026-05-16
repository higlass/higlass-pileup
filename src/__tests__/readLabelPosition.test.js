/**
 * Tests for the readLabelPosition feature in PileupTrack.
 *
 * Covers:
 *   A) updateReadLabels() passes the correct x-position and PIXI anchor.x
 *      to TextManager for each of the three position options (left/center/right).
 *   B) updateReadLabels() caches genomicFrom/genomicTo (not a pre-computed center).
 *   C) updateTextPositions() repositions labels correctly for each option.
 *   D) The default (no option set) falls back to 'center'.
 */

// ---------------------------------------------------------------------------
// Module mocks (must be declared before any imports)
// ---------------------------------------------------------------------------

jest.mock('../bam-fetcher', () => ({
  __esModule: true,
  default: class BAMDataFetcher {
    constructor() {
      this.uid = 'mock-uid';
      this.dataConfig = {};
      this.track = null;
    }
  },
}));

jest.mock('threads', () => ({
  spawn: jest.fn(() =>
    Promise.resolve({
      renderSegments: jest.fn(),
      resetPrevRows: jest.fn(() => Promise.resolve()),
      getReadsForLabeling: jest.fn(() => Promise.resolve([])),
    }),
  ),
  BlobWorker: { fromText: jest.fn(() => null) },
}));

jest.mock('../bam-utils', () => ({
  PILEUP_COLORS: {
    A: [1, 0, 0, 1],
    T: [0, 1, 0, 1],
    G: [0, 0, 1, 1],
    C: [1, 1, 0, 1],
    N: [0.5, 0.5, 0.5, 1],
    X: [0.5, 0.5, 0.5, 1],
    PLUS_STRAND: [0, 0, 1, 1],
    MINUS_STRAND: [1, 0, 0, 1],
    LARGE_INSERT_SIZE: [1, 0, 1, 1],
    SMALL_INSERT_SIZE: [0, 1, 1, 1],
    LL: [1, 0.5, 0, 1],
    RR: [0, 0.5, 1, 1],
    RL: [0.5, 0, 1, 1],
  },
  PROTEIN_AMINO_ACIDS: [],
  DNA_BASES: ['A', 'T', 'G', 'C'],
  cigarTypeToText: jest.fn(() => ''),
  areMatesRequired: jest.fn(() => false),
  calculateInsertSize: jest.fn(() => 0),
  posToChrPos: jest.fn(() => [0, 0]),
  isProteinColorScale: jest.fn(() => false),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal d3-scale.scaleLinear that supports .domain() / .range() chaining.
 * Accepts optional starting domain/range so we can also build a zoomed scale.
 */
function makeLinearScale(domain = [0, 1000], range = [0, 800]) {
  let _domain = domain;
  let _range = range;
  const scale = (x) =>
    _range[0] +
    ((_range[1] - _range[0]) * (x - _domain[0])) / (_domain[1] - _domain[0]);
  scale.domain = (d) => {
    if (d !== undefined) { _domain = d; return scale; }
    return _domain;
  };
  scale.range = (r) => {
    if (r !== undefined) { _range = r; return scale; }
    return _range;
  };
  return scale;
}

/** Minimal mock of HiGlass Core. */
const mockHGC = {
  tracks: {
    Tiled1DPixiTrack: class MockBase {
      constructor(context, options) {
        this.options = options || {};
        this.dataFetcher = context && context.dataFetcher;
        this.pMain = { x: 0, addChild: jest.fn(), removeChild: jest.fn() };
        this.pLabel = { addChild: jest.fn() };
        this.pBorder = { clear: jest.fn() };
        this.position = [0, 0];
        this.dimensions = [800, 100];
        this._xScale = makeLinearScale();
        this.id = 'mock-track-id';
        this.visibleTileIds = new Set();
        this.fetchedTiles = {};
        this.is2d = false;
      }
      rerender() {}
      draw() {}
      animate() {}
      drawError() {}
    },
  },
  libraries: {
    PIXI: {
      Text: class MockText {
        constructor() {
          this.anchor = { x: 0, y: 0 };
          this.visible = false;
          this.text = '';
          this.x = 0;
          this.y = 0;
        }
      },
      Graphics: class MockGraphics {
        constructor() {
          this.scale = { x: 1, y: 1 };
          this.position = { x: 0, y: 0 };
        }
        addChild() {}
        removeChild() {}
        clear() {}
      },
      Geometry: class MockGeometry {
        addAttribute() { return this; }
        addIndex() {}
      },
      Mesh: class MockMesh {
        constructor() {
          this.scale = { x: 1, y: 1 };
          this.position = { x: 0, y: 0 };
        }
      },
      State: class MockState {},
      Shader: { from: jest.fn(() => ({})) },
      Texture: { fromBuffer: jest.fn(() => ({})) },
      UniformGroup: class MockUniformGroup { constructor() {} },
    },
    d3Scale: { scaleLinear: makeLinearScale },
    d3Zoom: { zoomIdentity: { k: 1, x: 0, y: 0 } },
    d3Array: {
      range: (start, stop) =>
        Array.from({ length: stop - start }, (_, i) => start + i),
    },
    d3Color: {
      rgb: jest.fn(() => ({ r: 128, g: 128, b: 128, opacity: 1 })),
      color: jest.fn(() => ({ hex: () => '#808080' })),
    },
  },
  utils: {
    showMousePosition: jest.fn(() => jest.fn()),
  },
};

// ---------------------------------------------------------------------------
// Track factory
// ---------------------------------------------------------------------------

import PileupTrackFactory from '../PileupTrack';

const BASE_OPTIONS = { showMousePosition: false };

function makeContext() {
  return {
    dataConfig: { type: 'bam', url: 'mock.bam', indexUrl: 'mock.bai' },
    viewUid: 'view-1',
    definition: { height: 100 },
    isShowGlobalMousePosition: () => false,
    pubSub: { subscribe: jest.fn(), publish: jest.fn() },
    chromInfoPath: '',
  };
}

/** Band scale: maps row index to y pixel position with a fixed row height. */
function makeBandScale(rowHeight = 20) {
  const scale = (rowIdx) => rowIdx * rowHeight;
  scale.bandwidth = () => rowHeight;
  return scale;
}

/**
 * A single mock read spanning genomic positions 100–300.
 *
 * With the default linear scale [0,1000] → [0,800]  (factor 0.8):
 *   left   anchor: _xScale(100) = 80
 *   center anchor: _xScale(200) = 160
 *   right  anchor: _xScale(300) = 240
 */
const MOCK_READ = {
  id: 'read1',
  from: 100,
  to: 300,
  row: 0,
  groupKey: 'default',
  readName: 'read1',
  mapq: 60,
  strand: '+',
  chrName: null,
  chrOffset: 0,
};

/**
 * Build a PileupTrack instance wired for label-position tests.
 * Pass a labelPosition string to pre-set options.readLabelPosition.
 */
function makeTrackForLabels(labelPosition = 'center') {
  const opts = {
    ...BASE_OPTIONS,
    // Use a single simple field to keep label text predictable.
    readLabels: { fields: ['readName'], separator: '' },
    maxReadLabels: 10,
    readLabelPosition: labelPosition,
  };
  const track = new PileupTrackFactory(mockHGC, makeContext(), opts);

  // Simulate a completed initial render.
  track.segmentGraphics = new mockHGC.libraries.PIXI.Graphics();
  track.drawnAtHeight = 100;
  track.dimensions = [800, 100];
  track.heightScaleK = 1;
  track.valueScaleTransform = { k: 1, y: 0 };
  track.prevOptions = { ...opts };

  // 5 rows of 20 px each.
  track.yScaleBands = { default: makeBandScale(20) };
  track.rowsMeta = { default: { rowCount: 5 } };

  // Ensure dataFetcher.uid is available for the worker call.
  track.dataFetcher = { uid: 'mock-uid' };

  // Replace the real TextManager with a simple mock.
  track.textManager = {
    texts: {},
    clear: jest.fn(),
    updateTexts: jest.fn(),
    updatePositions: jest.fn(),
  };

  // Override the worker so getReadsForLabeling returns our mock read.
  track.worker = Promise.resolve({
    getReadsForLabeling: jest.fn(() => Promise.resolve([MOCK_READ])),
    renderSegments: jest.fn(),
    resetPrevRows: jest.fn(() => Promise.resolve()),
  });

  return track;
}

/** Flush all resolved promises in the microtask queue. */
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// ---------------------------------------------------------------------------
// Tests A: updateReadLabels() — x position and anchor per option
// ---------------------------------------------------------------------------

describe('PileupTrack.updateReadLabels() readLabelPosition', () => {
  beforeEach(() => jest.clearAllMocks());

  test('center: x is at the read midpoint with anchor.x = 0.5', async () => {
    const track = makeTrackForLabels('center');
    jest.spyOn(track, 'animate').mockImplementation(() => {});

    track.updateReadLabels();
    await flushPromises();

    expect(track.textManager.updateTexts).toHaveBeenCalledTimes(1);
    const [textData] = track.textManager.updateTexts.mock.calls[0];
    const label = textData.find((d) => d.uid === 'read1');

    // _xScale([0,1000]->[0,800]): xScale(200) = 160
    expect(label.x).toBe(160);
    expect(label.anchor.x).toBe(0.5);
  });

  test('left: x is at the read start with anchor.x = 0', async () => {
    const track = makeTrackForLabels('left');
    jest.spyOn(track, 'animate').mockImplementation(() => {});

    track.updateReadLabels();
    await flushPromises();

    expect(track.textManager.updateTexts).toHaveBeenCalledTimes(1);
    const [textData] = track.textManager.updateTexts.mock.calls[0];
    const label = textData.find((d) => d.uid === 'read1');

    // _xScale(100) = 80
    expect(label.x).toBe(80);
    expect(label.anchor.x).toBe(0);
  });

  test('right: x is at the read end with anchor.x = 1', async () => {
    const track = makeTrackForLabels('right');
    jest.spyOn(track, 'animate').mockImplementation(() => {});

    track.updateReadLabels();
    await flushPromises();

    expect(track.textManager.updateTexts).toHaveBeenCalledTimes(1);
    const [textData] = track.textManager.updateTexts.mock.calls[0];
    const label = textData.find((d) => d.uid === 'read1');

    // _xScale(300) = 240
    expect(label.x).toBe(240);
    expect(label.anchor.x).toBe(1);
  });

  test('default (option not set): falls back to center behaviour', async () => {
    const track = makeTrackForLabels('center');
    delete track.options.readLabelPosition;
    jest.spyOn(track, 'animate').mockImplementation(() => {});

    track.updateReadLabels();
    await flushPromises();

    const [textData] = track.textManager.updateTexts.mock.calls[0];
    const label = textData.find((d) => d.uid === 'read1');

    expect(label.x).toBe(160);
    expect(label.anchor.x).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Tests B: updateReadLabels() — cache stores genomicFrom / genomicTo
// ---------------------------------------------------------------------------

describe('PileupTrack.updateReadLabels() label cache', () => {
  beforeEach(() => jest.clearAllMocks());

  test('stores genomicFrom and genomicTo (not a pre-computed genomicX)', async () => {
    const track = makeTrackForLabels('center');
    jest.spyOn(track, 'animate').mockImplementation(() => {});

    track.updateReadLabels();
    await flushPromises();

    expect(track._cachedLabelData).toHaveLength(1);
    const cached = track._cachedLabelData[0];

    expect(cached.genomicFrom).toBe(100);
    expect(cached.genomicTo).toBe(300);
    expect(cached).not.toHaveProperty('genomicX');
  });

  test('cached uid matches the read id', async () => {
    const track = makeTrackForLabels('center');
    jest.spyOn(track, 'animate').mockImplementation(() => {});

    track.updateReadLabels();
    await flushPromises();

    expect(track._cachedLabelData[0].uid).toBe('read1');
  });
});

// ---------------------------------------------------------------------------
// Tests C: updateTextPositions() — x position per option on a new scale
// ---------------------------------------------------------------------------

describe('PileupTrack.updateTextPositions() readLabelPosition', () => {
  /**
   * Zoomed-in scale: [0,500] → [0,800]  (factor 1.6).
   *   newXScale(100) = 160
   *   newXScale(200) = 320
   *   newXScale(300) = 480
   */
  const zoomedScale = makeLinearScale([0, 500], [0, 800]);

  function makeTrackWithCache(labelPosition) {
    const track = makeTrackForLabels(labelPosition);
    // Pre-populate the cache as updateReadLabels() would have done.
    track._cachedLabelData = [{
      uid: 'read1',
      genomicFrom: 100,
      genomicTo: 300,
      groupKey: 'default',
      row: 0,
      rowY: 10,
    }];
    // Provide a texts entry so updateTextPositions() does not skip the uid.
    track.textManager.texts['read1'] = { visible: true };
    return track;
  }

  beforeEach(() => jest.clearAllMocks());

  test('center: repositions to the read midpoint on the new scale', () => {
    const track = makeTrackWithCache('center');

    track.updateTextPositions(zoomedScale);

    expect(track.textManager.updatePositions).toHaveBeenCalledTimes(1);
    const posMap = track.textManager.updatePositions.mock.calls[0][0];
    // zoomedScale(200) = 320
    expect(posMap['read1'].x).toBe(320);
  });

  test('left: repositions to the read start on the new scale', () => {
    const track = makeTrackWithCache('left');

    track.updateTextPositions(zoomedScale);

    const posMap = track.textManager.updatePositions.mock.calls[0][0];
    // zoomedScale(100) = 160
    expect(posMap['read1'].x).toBe(160);
  });

  test('right: repositions to the read end on the new scale', () => {
    const track = makeTrackWithCache('right');

    track.updateTextPositions(zoomedScale);

    const posMap = track.textManager.updatePositions.mock.calls[0][0];
    // zoomedScale(300) = 480
    expect(posMap['read1'].x).toBe(480);
  });

  test('default (option not set): falls back to center when repositioning', () => {
    const track = makeTrackWithCache('center');
    delete track.options.readLabelPosition;

    track.updateTextPositions(zoomedScale);

    const posMap = track.textManager.updatePositions.mock.calls[0][0];
    // center = zoomedScale(200) = 320
    expect(posMap['read1'].x).toBe(320);
  });
});
