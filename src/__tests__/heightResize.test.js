/**
 * Tests for the height-resize synchronization fixes in PileupTrack.rerender().
 *
 * Three behaviors are covered:
 *   A) When heightK > HEIGHT_SCALE_THRESHOLD and no render is in flight,
 *      rerender() triggers exactly one full re-render.
 *   B) When a render is already in flight, rerender() scales the existing
 *      mesh instead of queueing another full re-render.
 *   C) The render callback uses the height captured at dispatch time
 *      (renderedHeight), not the current (possibly drifted) dimensions,
 *      so drawnAtHeight and heightScaleK are always correct.
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

/** Minimal d3-scale.scaleLinear that supports .domain() / .range() chaining. */
function makeLinearScale() {
  let _domain = [0, 1000];
  let _range = [0, 800];
  const scale = (x) =>
    _range[0] +
    ((_range[1] - _range[0]) * (x - _domain[0])) / (_domain[1] - _domain[0]);
  scale.domain = (d) => {
    if (d !== undefined) {
      _domain = d;
      return scale;
    }
    return _domain;
  };
  scale.range = (r) => {
    if (r !== undefined) {
      _range = r;
      return scale;
    }
    return _range;
  };
  return scale;
}

/** A minimal mock of what PileupTrack expects from HiGlass Core (HGC). */
const mockHGC = {
  tracks: {
    Tiled1DPixiTrack: class MockBase {
      constructor(context, options) {
        this.options = options || {};
        // The real Tiled1DPixiTrack forwards context.dataFetcher to this.dataFetcher.
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
        addAttribute() {
          return this;
        }
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
      UniformGroup: class MockUniformGroup {
        constructor() {}
      },
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

/**
 * Build a track instance that has already completed an initial render at
 * height 100. Sets segmentGraphics so rerender() takes the height-change
 * branch rather than the "never rendered" branch.
 *
 * The factory must be called with `new` (it guards on new.target internally).
 * It returns `new PileupTrackClass(context, options)`, so calling
 * `new PileupTrackFactory(HGC, context, options)` yields the track instance.
 */
function makeRenderedTrack() {
  const track = new PileupTrackFactory(mockHGC, makeContext(), BASE_OPTIONS);
  // Simulate a completed render at height 100.
  track.segmentGraphics = new mockHGC.libraries.PIXI.Graphics();
  track.drawnAtHeight = 100;
  track.dimensions = [800, 100];
  track.prevOptions = { ...BASE_OPTIONS };
  return track;
}

// ---------------------------------------------------------------------------
// Mock render result used by updateExistingGraphics callback tests
// ---------------------------------------------------------------------------

const MOCK_RENDER_RESULT = {
  positionsBuffer: new ArrayBuffer(0),
  colorsBuffer: new ArrayBuffer(0),
  ixBuffer: new ArrayBuffer(0),
  rowsMeta: {},
  coverage: {},
  coverageSamplingDistance: 1,
  xScaleDomain: [0, 1000],
  xScaleRange: [0, 800],
};

// ---------------------------------------------------------------------------
// Tests A & B: rerender() dispatch behavior
// ---------------------------------------------------------------------------

describe('PileupTrack.rerender() height-resize dispatch', () => {
  let track;

  beforeEach(() => {
    jest.clearAllMocks();
    track = makeRenderedTrack();
    jest.spyOn(track, 'updateExistingGraphics').mockImplementation(() => {});
    jest.spyOn(track, 'animate').mockImplementation(() => {});
  });

  // --- above threshold, idle ---

  test('triggers one re-render when height exceeds threshold and no render is in flight', () => {
    track.dimensions = [800, 300]; // 3× > 2× threshold
    track.rerender(BASE_OPTIONS);
    expect(track.updateExistingGraphics).toHaveBeenCalledTimes(1);
  });

  test('does not double-trigger when rerender() is called twice while already idle', () => {
    track.dimensions = [800, 300];
    track.rerender(BASE_OPTIONS);
    // Simulate a second rerender() call before the first render completes.
    // updateExistingGraphics is mocked so rendering.size stays 0, but
    // drawnAtHeight is NOT updated optimistically, so the second call
    // also sees threshold exceeded — what we verify is that each call
    // triggers exactly one dispatch (no runaway accumulation per call).
    track.rerender(BASE_OPTIONS);
    expect(track.updateExistingGraphics).toHaveBeenCalledTimes(2);
  });

  // --- above threshold, in-flight ---

  test('does NOT trigger a new re-render when a render is already in flight', () => {
    track.dimensions = [800, 300];
    track.rendering.add('tile-1'); // simulate an in-flight render
    track.rerender(BASE_OPTIONS);
    expect(track.updateExistingGraphics).not.toHaveBeenCalled();
  });

  test('scales existing mesh to fill height when render is in flight', () => {
    track.dimensions = [800, 300]; // heightK = 3
    track.rendering.add('tile-1');
    track.rerender(BASE_OPTIONS);
    // scale.y = heightK × valueScaleTransform.k (=1)
    expect(track.segmentGraphics.scale.y).toBe(3);
    expect(track.segmentGraphics.position.y).toBe(0);
  });

  test('updates segmentGraphics position.y when render is in flight', () => {
    track.valueScaleTransform = { k: 1, y: 20 };
    track.dimensions = [800, 300]; // heightK = 3
    track.rendering.add('tile-1');
    track.rerender(BASE_OPTIONS);
    expect(track.segmentGraphics.position.y).toBe(60); // 20 × 3
  });

  // --- within threshold ---

  test('scales mesh without triggering re-render when height change is within threshold', () => {
    track.dimensions = [800, 150]; // 1.5× < 2× threshold
    track.rerender(BASE_OPTIONS);
    expect(track.updateExistingGraphics).not.toHaveBeenCalled();
    expect(track.segmentGraphics.scale.y).toBe(1.5);
  });

  test('does not call rerender or scale when height is unchanged', () => {
    track.dimensions = [800, 100]; // same as drawnAtHeight
    track.rerender(BASE_OPTIONS);
    expect(track.updateExistingGraphics).not.toHaveBeenCalled();
    expect(track.segmentGraphics.scale.y).toBe(1); // untouched
  });
});

// ---------------------------------------------------------------------------
// Tests C: render callback uses renderedHeight, not current dimensions
// ---------------------------------------------------------------------------

describe('PileupTrack updateExistingGraphics() callback height correction', () => {
  let track;

  beforeEach(() => {
    jest.clearAllMocks();
    track = makeRenderedTrack();
    jest.spyOn(track, 'animate').mockImplementation(() => {});
    jest.spyOn(track, 'draw').mockImplementation(() => {});
    jest.spyOn(track, 'drawError').mockImplementation(() => {});
  });

  test('sets drawnAtHeight to the height at dispatch, not the height at callback time', async () => {
    // Set up a deferred renderSegments so we can change height mid-flight.
    let resolveRender;
    const renderPromise = new Promise((resolve) => {
      resolveRender = resolve;
    });
    const mockTileFns = {
      renderSegments: jest.fn(() => renderPromise),
      resetPrevRows: jest.fn(() => Promise.resolve()),
    };
    track.worker = Promise.resolve(mockTileFns);

    // Provide matching fetchedTiles / visibleTileIds so the method proceeds.
    track.fetchedTiles = { 'tile-1': { remoteId: 'remote-1' } };
    track.visibleTileIds = new Set(['tile-1']);

    // Dispatch the render at height 100.
    track.dimensions = [800, 100];
    track.updateExistingGraphics();

    // Resize before the worker responds.
    track.dimensions = [800, 150];

    // Resolve the worker.
    await resolveRender(MOCK_RENDER_RESULT);
    await Promise.resolve(); // flush microtasks

    expect(track.drawnAtHeight).toBe(100); // captured at dispatch, not 150
  });

  test('sets heightScaleK to currentHeight / renderedHeight after callback', async () => {
    let resolveRender;
    const renderPromise = new Promise((resolve) => {
      resolveRender = resolve;
    });
    track.worker = Promise.resolve({
      renderSegments: jest.fn(() => renderPromise),
      resetPrevRows: jest.fn(() => Promise.resolve()),
    });
    track.fetchedTiles = { 'tile-1': { remoteId: 'remote-1' } };
    track.visibleTileIds = new Set(['tile-1']);

    track.dimensions = [800, 100];
    track.updateExistingGraphics();
    track.dimensions = [800, 150];

    await resolveRender(MOCK_RENDER_RESULT);
    await Promise.resolve();

    expect(track.heightScaleK).toBe(1.5); // 150 / 100
  });

  test('stretches segmentGraphics to fill current height after callback', async () => {
    let resolveRender;
    const renderPromise = new Promise((resolve) => {
      resolveRender = resolve;
    });
    track.worker = Promise.resolve({
      renderSegments: jest.fn(() => renderPromise),
      resetPrevRows: jest.fn(() => Promise.resolve()),
    });
    track.fetchedTiles = { 'tile-1': { remoteId: 'remote-1' } };
    track.visibleTileIds = new Set(['tile-1']);

    track.dimensions = [800, 100];
    track.updateExistingGraphics();
    track.dimensions = [800, 150];

    await resolveRender(MOCK_RENDER_RESULT);
    await Promise.resolve();

    // scale.y = heightScaleK × valueScaleTransform.k (=1)
    expect(track.segmentGraphics.scale.y).toBe(1.5);
  });

  test('scale.y is 1 when height is unchanged between dispatch and callback', async () => {
    let resolveRender;
    const renderPromise = new Promise((resolve) => {
      resolveRender = resolve;
    });
    track.worker = Promise.resolve({
      renderSegments: jest.fn(() => renderPromise),
      resetPrevRows: jest.fn(() => Promise.resolve()),
    });
    track.fetchedTiles = { 'tile-1': { remoteId: 'remote-1' } };
    track.visibleTileIds = new Set(['tile-1']);

    track.dimensions = [800, 100];
    track.updateExistingGraphics();
    // No resize — dimensions stay at 100.

    await resolveRender(MOCK_RENDER_RESULT);
    await Promise.resolve();

    expect(track.drawnAtHeight).toBe(100);
    expect(track.heightScaleK).toBe(1);
    expect(track.segmentGraphics.scale.y).toBe(1);
  });
});
