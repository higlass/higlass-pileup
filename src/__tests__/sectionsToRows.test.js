/**
 * Tests for the pileup row-layout algorithm (sectionsToRows / assignSectionToRow).
 *
 * Covers:
 *   A) New sections that fit in existing rows are not pushed to the bottom when
 *      prevRows are present (regression: _maxFrom/_minTo were never updated after
 *      processing prevSections, causing the fast-path to always fire and append
 *      every new section to a brand-new bottom row).
 */

// ---------------------------------------------------------------------------
// Polyfills for Node 10 test environment
// ---------------------------------------------------------------------------

// Array.prototype.flat is not available in Node <11 but is used in
// bam-fetcher-worker.js.  Polyfill it so Jest can run the layout functions.
if (!Array.prototype.flat) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.flat = function flat(depth = 1) {
    return depth > 0
      ? this.reduce(
          (acc, val) =>
            acc.concat(Array.isArray(val) ? val.flat(depth - 1) : val),
          [],
        )
      : this.slice();
  };
}

// ---------------------------------------------------------------------------
// Module mocks (must be declared before any imports)
// ---------------------------------------------------------------------------

jest.mock('threads/worker', () => ({
  expose: jest.fn(),
  Transfer: jest.fn((obj) => obj),
}));

jest.mock('@gmod/bam', () => ({ BamFile: jest.fn() }));

// d3 packages in this project are ESM-only; mock them so Jest (CommonJS) can
// load bam-fetcher-worker without a SyntaxError.  The layout functions under
// test do not use d3 at all.
jest.mock('d3-array', () => ({ range: jest.fn() }));
jest.mock('d3-scale', () => ({
  scaleLinear: jest.fn(() => jest.fn()),
  scaleBand: jest.fn(() => jest.fn()),
}));
jest.mock('d3-format', () => ({ format: jest.fn(() => jest.fn()) }));

jest.mock('../bam-utils', () => ({
  getSubstitutions: jest.fn(() => []),
  calculateInsertSize: jest.fn(() => 0),
  areMatesRequired: jest.fn(() => false),
  SINGLE_TO_THREE_LETTER_AA: {},
  isProteinColorScale: jest.fn(() => false),
  PILEUP_COLORS: {},
  PILEUP_COLOR_IXS: {},
  cigarTypeToText: jest.fn(() => ''),
  posToChrPos: jest.fn(() => [0, 0]),
  DNA_BASES: ['A', 'T', 'G', 'C'],
  PROTEIN_AMINO_ACIDS: [],
}));

jest.mock('../chrominfo-utils', () => ({
  parseChromsizesRows: jest.fn(() => []),
  ChromosomeInfo: jest.fn(),
}));

import { sectionsToRows } from '../bam-fetcher-worker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_TRACK_OPTIONS = { viewAsPairs: false, sortByBase: null };

/** Build a minimal section object as sectionsToRows expects. */
function makeSection(id, from, to, row = null) {
  return {
    id: String(id),
    fromWithClipping: from,
    toWithClipping: to,
    row,
    segments: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sectionsToRows', () => {
  describe('_maxFrom/_minTo initialisation after prevRows', () => {
    /**
     * Regression test for the bug where new reads were always appended to the
     * bottommost row when prevRows existed.
     *
     * Setup:
     *   Row 0: section A  [100, 120]
     *   Row 1: section B  [130, 150]
     *   Row 2: section C  [160, 180]
     *
     * New section D [50, 70] lies entirely to the LEFT of all existing reads.
     * It does not overlap with any row, so it should be placed in row 0.
     *
     * Before the fix, _maxFrom stayed at -Infinity and _minTo stayed at
     * Infinity after processing prevSections (the else-branch in
     * assignSectionToRow never updated them).  This caused the fast-path
     * condition to always be true, pushing every new section into a fresh
     * bottom row instead of scanning for a fit.
     */
    test('new reads to the left of the viewport fit into existing rows', () => {
      const padding = 5;

      const sectionA = makeSection('a', 100, 120, 0);
      const sectionB = makeSection('b', 130, 150, 1);
      const sectionC = makeSection('c', 160, 180, 2);

      const prevRows = [[sectionA], [sectionB], [sectionC]];

      // New read arriving from a freshly loaded left-side tile.
      const sectionD = makeSection('d', 50, 70);

      const outputRows = sectionsToRows(
        [sectionA, sectionB, sectionC, sectionD],
        { prevRows, padding },
        DEFAULT_TRACK_OPTIONS,
      );

      // The new section must not have created an extra row.
      expect(outputRows.length).toBe(3);

      // sectionD (ends at 75 with padding) ends before row 0 starts (95 with
      // padding), so it should land in row 0.
      const row0Ids = outputRows[0].map((s) => s.id);
      expect(row0Ids).toContain('d');
    });

    /**
     * Sanity check: when there are no prevRows the algorithm still works and
     * non-overlapping reads are packed into as few rows as possible.
     */
    test('non-overlapping reads without prevRows are packed into one row', () => {
      const padding = 5;

      // Gaps between reads exceed 2*padding (10), so padded extents never touch.
      const sectionA = makeSection('a', 10, 20);  // padded [5, 25]
      const sectionB = makeSection('b', 40, 50);  // padded [35, 55] — 35 > 25 ✓
      const sectionC = makeSection('c', 70, 80);  // padded [65, 85] — 65 > 55 ✓

      const outputRows = sectionsToRows(
        [sectionA, sectionB, sectionC],
        { prevRows: [], padding },
        DEFAULT_TRACK_OPTIONS,
      );

      expect(outputRows.length).toBe(1);
    });

    /**
     * Overlapping reads must still be placed in separate rows even when
     * prevRows are present.
     */
    test('overlapping new reads are placed in separate rows', () => {
      const padding = 5;

      // One existing read occupying the full width.
      const sectionA = makeSection('a', 100, 200, 0);
      const prevRows = [[sectionA]];

      // New reads that each overlap sectionA — each needs its own row.
      const sectionB = makeSection('b', 120, 160);
      const sectionC = makeSection('c', 130, 170);

      const outputRows = sectionsToRows(
        [sectionA, sectionB, sectionC],
        { prevRows, padding },
        DEFAULT_TRACK_OPTIONS,
      );

      // B and C both overlap the existing row 0, so the layout needs 3 rows.
      expect(outputRows.length).toBe(3);
    });
  });
});
