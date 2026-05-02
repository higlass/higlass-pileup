import { range } from 'd3-array';
import { scaleLinear, scaleBand } from 'd3-scale';
import { format } from 'd3-format';
import { expose, Transfer } from 'threads/worker';
import { BamFile } from '@gmod/bam';
import {
  getSubstitutions,
  calculateInsertSize,
  areMatesRequired,
  SINGLE_TO_THREE_LETTER_AA,
  isProteinColorScale,
} from './bam-utils';
import LRU from 'lru-cache';
import { PILEUP_COLOR_IXS } from './bam-utils';
import { parseChromsizesRows, ChromosomeInfo } from './chrominfo-utils';

function currTime() {
  const d = new Date();
  return d.getTime();
}

const groupBy = (xs, key) =>
  xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});

function natcmp(xRow, yRow) {
  const x = xRow[0];
  const y = yRow[0];

  if (x.indexOf('_') >= 0) {
    const xParts = x.split('_');
    if (y.indexOf('_') >= 0) {
      // chr_1 vs chr_2
      const yParts = y.split('_');

      return natcmp(xParts[1], yParts[1]);
    }

    // chr_1 vs chr1
    // chr1 comes first
    return 1;
  }

  if (y.indexOf('_') >= 0) {
    // chr1 vs chr_1
    // y comes second
    return -1;
  }

  const xParts = [];
  const yParts = [];

  for (const part of x.match(/(\d+|[^\d]+)/g)) {
    xParts.push(Number.isNaN(part) ? part.toLowerCase() : +part);
  }

  for (const part of y.match(/(\d+|[^\d]+)/g)) {
    xParts.push(Number.isNaN(part) ? part.toLowerCase() : +part);
  }

  // order of these parameters is purposefully reverse how they should be
  // ordered
  for (const key of ['m', 'y', 'x']) {
    if (y.toLowerCase().includes(key)) return -1;
    if (x.toLowerCase().includes(key)) return 1;
  }

  if (xParts < yParts) {
    return -1;
  } else if (yParts > xParts) {
    return 1;
  }

  return 0;
}

const getBaseSortGroup = (segment, sortByBase) => {
    // The following loop could be replaced by a binary search
    // if the substitutions were sorted
    for (const substitution of segment.substitutions) {
      if (
        substitution.variant &&
        segment.from - segment.chrOffset + substitution.pos ==
          sortByBase.pos
      ) {
        return substitution.variant;
      }
    }

    return null;
}

const groupSectionsBySortedBase = (sections, sortByBase) => {
  // This function will take a set of sections and partition them
  // into groups of sections and return them in some order

  // We'll assume that all sections are on the same chromosome as the
  // sortByBase position

  // sectionGroups will store the groups of sections for each base
  // type at the sort by position
  const sectionGroups = {};

  for (const section of sections) {

    for (const segment of section.segments) {
      segment.chrOffset = segment.chrOffset || 0;

      if (
        // If the segment has no chrName then just proceed as usual
        (!segment.chrName || (segment.chrName == sortByBase.chr)) &&
        segment.from - segment.chrOffset <= sortByBase.pos &&
        sortByBase.pos <= segment.to - segment.chrOffset
      ) {
        // The read overlaps the sortByBase position
        let sortGroup = null;

        if (sortByBase.column) {
          // we're sorting by a column
          sortGroup = segment.extra[sortByBase.column]
        } else {
          sortGroup = getBaseSortGroup(segment, sortByBase)
        }

        if (sectionGroups[sortGroup]) {
          sectionGroups[sortGroup].push(section);
        } else {
          sectionGroups[sortGroup] = [section];
        }
      }
    }
  }

  // Sort the chunks of sections to return.
  // The existing sorting probably isn't the one we want because
  // sections that don't have a substitution at this location will
  // have a "null" there
  const sortedBases = Object.keys(sectionGroups).sort();

  let toReturn = [];
  for (const base of sortedBases) {
    toReturn = toReturn.concat(sectionGroups[base]);
  }

  return toReturn;
};

const addClippingAdjustments = (segment) => {
  /** When we display segments with clipping we want to include the
   * clipping section on the same row and not have it overlap with other segments.
   * 
   * If we just used the from and to positions, then the clipping portion
   * would not be counted and it would overlap with other segments
   */
  let fromClippingAdjustment = 0;
  let toClippingAdjustment = 0;

  // We are doing this for row calculation, so that there is no overlap of clipped regions with regular ones
  segment.substitutions.forEach((sub) => {
    // left soft clipped region
    // make sure to change this in tabularJsonToRowJson
    if ((sub.type === 'S' || sub.type === 'H') && sub.pos < 0) {
      fromClippingAdjustment = -sub.length;
    } else if ((sub.type === 'S' || sub.type === 'H') && sub.pos > 0) {
      toClippingAdjustment = sub.length;
    }
  });

  segment.fromWithClipping = segment.from + fromClippingAdjustment;
  segment.toWithClipping = segment.to + toClippingAdjustment;

  return segment;
}

const bamRecordToJson = (bamRecord, chrName, chrOffset, trackOptions) => {
  const seq = bamRecord.get('seq');
  const from = +bamRecord.get('start') + 1 + chrOffset;
  const to = +bamRecord.get('end') + 1 + chrOffset;

  const segment = {
    id: bamRecord.get('id'),
    mate_ids: [], // split reads can have multiple mates
    from: from,
    to: to,
    fromWithClipping: from,
    toWithClipping: to,
    md: bamRecord.get('MD'),
    sa: bamRecord.get('SA'), // Needed to determine if this is a split read
    chrName,
    chrOffset,
    cigar: bamRecord.get('cigar'),
    mapq: bamRecord.get('mq'),
    strand: bamRecord.get('strand') === 1 ? '+' : '-',
    row: null,
    readName: bamRecord.get('name'),
    color: PILEUP_COLOR_IXS.BG,
    colorOverride: null,
    mappingOrientation: null,
    substitutions: [],
  };

  if (segment.strand === '+' && trackOptions.plusStrandColor) {
    segment.color = PILEUP_COLOR_IXS.PLUS_STRAND;
  } else if (segment.strand === '-' && trackOptions.minusStrandColor) {
    segment.color = PILEUP_COLOR_IXS.MINUS_STRAND;
  }

  segment.substitutions = getSubstitutions(segment, seq);

  addClippingAdjustments(segment);

  return segment;
};

// This will group the segments by readName and assign mates to reads
const findMates = (segments) => {
  const segmentsByReadName = groupBy(segments, 'readName');

  Object.entries(segmentsByReadName).forEach(([readName, segmentGroup]) => {
    if (segmentGroup.length === 2) {
      const read = segmentGroup[0];
      const mate = segmentGroup[1];
      read.mate_ids = [mate.id];
      mate.mate_ids = [read.id];

      read.mates = [mate];
      mate.mates = [read];
    } else if (segmentGroup.length > 2) {
      // It might be useful to distinguish reads from chimeric alignments in the future,
      // e.g., if we want to highlight read orientations of split reads. Not doing this for now.
      // See flags here: https://broadinstitute.github.io/picard/explain-flags.html
      // var supplementaryAlignmentMask = 1 << 11;
      // var firstInPairMask = 1 << 6;
      // const isFirstInPair = segment.flags & firstInPairMask;
      // const isSupplementaryAlignment = segment.flags & supplementaryAlignmentMask;

      // For simplicity a read will be a mate of every other read in the group.
      // it will only be used for the mouseover and it is probably useful, if the whole group is highlighted on hover
      segmentGroup.forEach((segment) => {
        segment.mates = segmentGroup.filter((s) => s != segment);
        segment.mate_ids = segment.mates.map((s) => s.id);
      });
    }
  });

  return segmentsByReadName;
};

const prepareHighlightedReads = (segmentsByReadName, trackOptions) => {
  const outlineMateOnHover = trackOptions.outlineMateOnHover;
  const highlightIS = trackOptions.highlightReadsBy.includes('insertSize');
  const highlightPO = trackOptions.highlightReadsBy.includes('pairOrientation');
  const highlightISandPO = trackOptions.highlightReadsBy.includes(
    'insertSizeAndPairOrientation',
  );

  if (highlightIS || highlightPO || highlightISandPO) {
    // segmentsByReadName = findMates(segments);
  } else if (outlineMateOnHover) {
    return;
  } else {
    return;
  }

  Object.entries(segmentsByReadName).forEach(([readName, segmentGroup]) => {
    // We are only highlighting insert size and pair orientation for normal (non chimeric reads)
    if (segmentGroup.length === 2) {
      // Changes to read or mate will change the values in the original segments array (reference)
      const read = segmentGroup[0];
      const mate = segmentGroup[1];
      read.colorOverride = null;
      mate.colorOverride = null;
      const segmentDistance = calculateInsertSize(read, mate);
      const hasLargeInsertSize =
        trackOptions.largeInsertSizeThreshold &&
        segmentDistance > trackOptions.largeInsertSizeThreshold;
      const hasSmallInsertSize =
        trackOptions.smallInsertSizeThreshold &&
        segmentDistance < trackOptions.smallInsertSizeThreshold;
      const hasLLOrientation = read.strand === '+' && mate.strand === '+';
      const hasRROrientation = read.strand === '-' && mate.strand === '-';
      const hasRLOrientation = read.from < mate.from && read.strand === '-';

      if (highlightIS) {
        if (hasLargeInsertSize) {
          read.colorOverride = PILEUP_COLOR_IXS.LARGE_INSERT_SIZE;
        } else if (hasSmallInsertSize) {
          read.colorOverride = PILEUP_COLOR_IXS.SMALL_INSERT_SIZE;
        }
      }

      if (
        highlightPO ||
        (highlightISandPO && (hasLargeInsertSize || hasSmallInsertSize))
      ) {
        if (hasLLOrientation) {
          read.colorOverride = PILEUP_COLOR_IXS.LL;
          read.mappingOrientation = '++';
        } else if (hasRROrientation) {
          read.colorOverride = PILEUP_COLOR_IXS.RR;
          read.mappingOrientation = '--';
        } else if (hasRLOrientation) {
          read.colorOverride = PILEUP_COLOR_IXS.RL;
          read.mappingOrientation = '-+';
        }
      }

      mate.colorOverride = read.colorOverride;
      mate.mappingOrientation = read.mappingOrientation;
    }
  });
};

/** Convert mapped read information returned from a higlass
    server to the internal track representation. This method is
    the counterpart to bamRecordToJson */
const tabularJsonToRowJson = (tabularJson) => {
  const rowJson = [];

  const headers = Object.keys(tabularJson);

  for (let i = 0; i < tabularJson[headers[0]].length; i++) {
    const newRow = {
      row: null,
      substitutions: [],
    };

    for (let j = 0; j < headers.length; j++) {
      newRow[headers[j]] = tabularJson[headers[j]][i];
    }

    // server-returned positions are 0-based so we make them 1-based
    newRow.from += 1;
    newRow.to += 1;

    // Convert the from and to positions to genome positions
    newRow.from += newRow.chrOffset;
    newRow.to += newRow.chrOffset;
    newRow.color = PILEUP_COLOR_IXS.BG;
    newRow.mate_ids = [];

    newRow.fromWithClipping = newRow.from;
    newRow.toWithClipping = newRow.to;

    if (newRow.variants) {
      // server has returned information about variants in the form
      // (queryPos, referencePos, substitution)
      // modeled on pysam's get_aligned_pairs
      newRow.substitutions = newRow.variants.map((x) => {
        const sub = {
          pos: x[1],
          variant: x[2].toUpperCase(),
          base: x[3].toUpperCase(),
          length: 1,
        };

        return sub;
      });
    }

    if (newRow.cigars) {
      let fromClippingAdjustment = 0;
      let toClippingAdjustment = 0;

      // server has returned cigar information
      // format: x[0] : start of region
      // x[1]: type of region (e.g. 'S', 'H', 'I', etc...)
      // x[2]: the length of the region
      for (const x of newRow.cigars) {
        const sub = {
          pos: x[0] - (newRow.from - newRow.chrOffset) + 1,
          type: x[1].toUpperCase(),
          length: x[2],
        };

        newRow.substitutions.push(sub);

        // left soft clipped region
        // Make sure to change this in bamRecordToJson as well

        if ((sub.type === 'S' || sub.type === 'H') && sub.pos < 0) {
          fromClippingAdjustment = -sub.length;
        } else if ((sub.type === 'S' || sub.type === 'H') && sub.pos > 0) {
          toClippingAdjustment = sub.length;
        }
      }

      newRow.fromWithClipping += fromClippingAdjustment;
      newRow.toWithClipping += toClippingAdjustment;
    }

    rowJson.push(newRow);
  }

  return rowJson;
};

// promises indexed by urls
const bamFiles = {};
const bamHeaders = {};
const dataOptions = {};

const serverInfos = {};

const MAX_TILES = 20;

// promises indexed by url
const chromSizes = {};
const chromInfos = {};
const tileValues = new LRU({ max: MAX_TILES });
const tilesetInfos = {};

// indexed by uuid
const dataConfs = {};

// Store local-tiles ids
const localDataConfs = {};

// Store http-tiles ids
const httpDataConfs = {};

// Cache previous row assignments per uid so they never need to be serialized
// through the main thread — avoids structured-clone of 50K+ segment objects.
const prevRowsByUid = {};

// Persistent geometry buffers, module-level so they are allocated once and
// reused across renders. Reusing the same memory avoids repeated large-alloc/
// free cycles that cause V8 heap fragmentation and OOM even when total free
// memory is sufficient. addRect grows them if needed (they never shrink).
// renderSegments slices the valid portion for zero-waste transfer.
let allPositions = new Float32Array(8000000);     // 1M rects = 32 MB
let allColors    = new Float32Array(4000000);     // 16 MB
let allIndexes   = new Int32Array(6000000);       // 24 MB
let allPositionsLength = 8000000;
let allColorsLength    = 4000000;
let allIndexesLength   = 6000000;

const trackOptions = {};

function authFetch(url, uid) {
  const { authHeader } = serverInfos[uid];
  const params = {
    headers: {},
  };

  if (authHeader) {
    params.headers.Authorization = authHeader;
  }

  return fetch(url, params);
}

const serverInit = (uid, server, tilesetUid, authHeader) => {
  serverInfos[uid] = {
    server,
    tilesetUid,
    authHeader,
  };
};

const localInit = (uid, tilesetInfo, tiles) => {
  localDataConfs[uid] = {
    tilesetInfo,
    tiles,
  };
};

const DEFAULT_DATA_OPTIONS = {
  maxTileWidth: 2e5,
};

const init = (uid, bamUrl, baiUrl, chromSizesUrl, options, tOptions) => {
  if (!options) {
    dataOptions[uid] = DEFAULT_DATA_OPTIONS;
  } else {
    dataOptions[uid] = { ...DEFAULT_DATA_OPTIONS, ...options };
  }

  if (!bamFiles[bamUrl]) {
    bamFiles[bamUrl] = new BamFile({
      bamUrl,
      baiUrl,
    });

    // we have to fetch the header before we can fetch data
    bamHeaders[bamUrl] = bamFiles[bamUrl].getHeader();
  }

  if (chromSizesUrl) {
    // if no chromsizes are passed in, we'll retrieve them
    // from the BAM file
    chromSizes[chromSizesUrl] =
      chromSizes[chromSizesUrl] ||
      new Promise((resolve) => {
        ChromosomeInfo(chromSizesUrl, resolve);
      });
  }

  dataConfs[uid] = {
    bamUrl,
    chromSizesUrl,
  };

  trackOptions[uid] = tOptions;
};

const localTilesetInfo = (uid) => {
  const tilesetInfo = Object.values(localDataConfs[uid].tilesetInfo)[0];
  tilesetInfos[uid] = tilesetInfo;

  return tilesetInfo;
};

// Fetch potentially gzip-compressed JSON from a URL.
// Handles manual decompression when the server does not set Content-Encoding: gzip
// (e.g. S3 objects stored as .json.gz with Content-Type: application/json).
const fetchJson = async (url) => {
  const response = await fetch(url);
  if (url.includes('.gz')) {
    const blob = await response.blob();
    const ds = new DecompressionStream('gzip');
    const stream = blob.stream().pipeThrough(ds);
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }
  return response.json();
};

const httpInit = (uid, tilesetInfo, tilesUrls) => {
  httpDataConfs[uid] = {
    tilesetInfo,
    tilesUrls,
  };
};

const httpTilesetInfo = (uid) => {
  return fetchJson(httpDataConfs[uid].tilesetInfo).then((info) => {
    // Normalize: server tileset info uses max_width; http tiles may use max_pos instead
    if (!info.max_width && info.max_pos) {
      info.max_width = info.max_pos[0];
    }
    tilesetInfos[uid] = info;
    return info;
  });
};

const httpFetchTilesDebounced = async (uid, tileIds) => {
  const { tilesUrls } = httpDataConfs[uid];
  const ret = {};

  await Promise.all(
    tileIds.map(async (tileId) => {
      const url = tilesUrls[tileId];
      if (!url) {
        ret[tileId] = [];
        tileValues.set(`${uid}.${tileId}`, []);
        return;
      }
      const tileData = await fetchJson(url);
      const rowJsonTile = tileData.map((x) => {
        const seg = addClippingAdjustments(x);
        // Sort substitutions once here so insertions render on top during every render call.
        seg.substitutions.sort((a, _b) => a.type === 'I' ? 1 : -1);
        return seg;
      });
      rowJsonTile.tilePositionId = tileId;
      ret[tileId] = rowJsonTile;
      tileValues.set(`${uid}.${tileId}`, rowJsonTile);
    }),
  );

  return ret;
};

const serverTilesetInfo = (uid) => {
  const url = `${serverInfos[uid].server}/tileset_info/?d=${serverInfos[uid].tilesetUid}`;

  return authFetch(url, uid)
    .then((d) => d.json())
    .then((j) => {
      const retVal = j[serverInfos[uid].tilesetUid];
      tilesetInfos[uid] = retVal;

      return retVal;
    });
};

// uid is required to get the correct chromInfo object in order to invoke absToChr.
// The track can store multiple chromInfo objects
const getCoverage = (uid, segmentList, samplingDistance) => {
  const coverage = {};
  let maxCoverage = 0;

  if (dataConfs[uid]) {
    const { chromSizesUrl, bamUrl } = dataConfs[uid];

    // getCoverage potentiall get calles before the chromInfos finished loading
    // Exit the function in this case
    if (!chromInfos[chromSizesUrl]) {
      return {
        coverage: coverage,
        maxCoverage: maxCoverage,
      };
    }
  }

  for (let j = 0; j < segmentList.length; j++) {
    const from = segmentList[j].from;
    const to = segmentList[j].to;
    // Find the first position that is in the sampling set
    const firstFrom = from - (from % samplingDistance);
    for (let i = firstFrom; i < to; i = i + samplingDistance) {
      if (!coverage[i]) {
        coverage[i] = {
          reads: 0,
          matches: 0,
          variants: {
            A: 0,
            C: 0,
            G: 0,
            T: 0,
            N: 0,
          },
          range: '', // Will be used to show the bounds of this coverage bin when mousing over
        };
      }
      coverage[i].reads++;
      coverage[i].matches++;
      maxCoverage = Math.max(maxCoverage, coverage[i].reads);
    }

    segmentList[j].substitutions.forEach((substitution) => {
      if (substitution.variant) {
        const posSub = from + substitution.pos;
        if (!coverage[posSub]) {
          return;
        }
        coverage[posSub].matches--;
        if (!coverage[posSub]['variants'][substitution.variant]) {
          coverage[posSub]['variants'][substitution.variant] = 0;
        }
        coverage[posSub]['variants'][substitution.variant]++;
      }
    });
  }

  if (dataConfs[uid]) {
    const { chromSizesUrl, bamUrl } = dataConfs[uid];
    const absToChr = chromInfos[chromSizesUrl].absToChr;
    Object.entries(coverage).forEach(([pos, entry]) => {
      const from = absToChr(pos);
      let range = from[0] + ':' + format(',')(from[1]);
      if (samplingDistance > 1) {
        const to = absToChr(Number.parseInt(pos, 10) + samplingDistance - 1);
        range += '-' + format(',')(to[1]);
      }
      entry.range = range;
    });
  }

  return {
    coverage: coverage,
    maxCoverage: maxCoverage,
  };
};

const tilesetInfo = (uid) => {
  const { chromSizesUrl, bamUrl } = dataConfs[uid];
  const promises = chromSizesUrl
    ? [bamHeaders[bamUrl], chromSizes[chromSizesUrl]]
    : [bamHeaders[bamUrl]];

  return Promise.all(promises).then((values) => {
    const TILE_SIZE = 1024;
    let chromInfo = null;

    if (values.length > 1) {
      // we've passed in a chromInfo file
      // eslint-disable-next-line prefer-destructuring
      chromInfo = values[1];
    } else {
      // no chromInfo provided so we have to take it
      // from the bam file index
      const chroms = [];
      for (const { refName, length } of bamFiles[bamUrl].indexToChr) {
        chroms.push([refName, length]);
      }

      chroms.sort(natcmp);

      chromInfo = parseChromsizesRows(chroms);
    }

    chromInfos[chromSizesUrl] = chromInfo;
    const chromsizes = chromInfo.cumPositions.map((x) => [
      x.chr,
      chromInfo.chromLengths[x.chr],
    ]);

    const retVal = {
      tile_size: TILE_SIZE,
      bins_per_dimension: TILE_SIZE,
      max_zoom: Math.ceil(
        Math.log(chromInfo.totalLength / TILE_SIZE) / Math.log(2),
      ),
      max_width: chromInfo.totalLength,
      min_pos: [0],
      max_pos: [chromInfo.totalLength],
      chromsizes,
    };

    tilesetInfos[uid] = retVal;

    return retVal;
  });
};

const tile = async (uid, z, x) => {
  const { maxTileWidth } = dataOptions[uid];

  const { bamUrl, chromSizesUrl } = dataConfs[uid];
  const bamFile = bamFiles[bamUrl];

  return tilesetInfo(uid).then((tsInfo) => {
    const tileWidth = +tsInfo.max_width / 2 ** +z;
    const recordPromises = [];

    if (tileWidth > maxTileWidth) {
      // this.errorTextText(
      //   'Zoomed out too far for this track. Zoomin further to see reads',
      // );
      return new Promise((resolve) => resolve([]));
    }

    // get the bounds of the tile
    let minX = tsInfo.min_pos[0] + x * tileWidth;
    const maxX = tsInfo.min_pos[0] + (x + 1) * tileWidth;

    const chromInfo = chromInfos[chromSizesUrl];

    const { chromLengths, cumPositions } = chromInfo;

    for (let i = 0; i < cumPositions.length; i++) {
      const chromName = cumPositions[i].chr;
      const chromStart = cumPositions[i].pos;

      const chromEnd = cumPositions[i].pos + chromLengths[chromName];
      tileValues.set(`${uid}.${z}.${x}`, []);

      if (chromStart <= minX && minX < chromEnd) {
        // start of the visible region is within this chromosome
        const fetchOptions = {
          viewAsPairs: areMatesRequired(trackOptions[uid]),
          // maxInsertSize: 2000,
        };

        if (maxX > chromEnd) {
          // the visible region extends beyond the end of this chromosome
          // fetch from the start until the end of the chromosome
          recordPromises.push(
            bamFile
              .getRecordsForRange(
                chromName,
                minX - chromStart,
                chromEnd - chromStart,
                fetchOptions,
              )
              .then((records) => {
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(
                    rec,
                    chromName,
                    cumPositions[i].pos,
                    trackOptions[uid],
                  ),
                );

                tileValues.set(
                  `${uid}.${z}.${x}`,
                  tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                );
              }),
          );

          // continue onto the next chromosome
          minX = chromEnd;
        } else {
          const endPos = Math.ceil(maxX - chromStart);
          const startPos = Math.floor(minX - chromStart);
          // the end of the region is within this chromosome
          recordPromises.push(
            bamFile
              .getRecordsForRange(chromName, startPos, endPos, fetchOptions)
              .then((records) => {
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(
                    rec,
                    chromName,
                    cumPositions[i].pos,
                    trackOptions[uid],
                  ),
                );

                tileValues.set(
                  `${uid}.${z}.${x}`,
                  tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                );
                return [];
              }),
          );

          // end the loop because we've retrieved the last chromosome
          break;
        }
      }
    }

    // flatten the array of promises so that it looks like we're
    // getting one long list of value
    return Promise.all(recordPromises).then((values) => values.flat());
  });
};

const tilesetInfoToStartEnd = (tsInfo, z, x) => {
  const tileWidth = tsInfo.max_width / 2 ** z;
  return [x * tileWidth, (x + 1) * tileWidth];
};

const localFetchTilesDebounced = async (uid, tileIds) => {
  const ret = {};

  // Strip the tilesetUid prefix from stored tile keys (e.g. "x.0.0" → "0.0"),
  // matching the behavior of HiGlass's LocalTileDataFetcher.
  const tilesData = {};
  for (const key of Object.keys(localDataConfs[uid].tiles)) {
    const newKey = key.split('.').slice(1).join('.');
    tilesData[newKey] = localDataConfs[uid].tiles[key];
  }

  for (const tileId of tileIds) {
    ret[tileId] = tilesData[tileId];
    tileValues.set(`${uid}.${tileId}`, ret[tileId]);
  }

  return ret;
};

const serverFetchTilesDebounced = async (uid, tileIds) => {
  const serverInfo = serverInfos[uid];
  const existingTiles = {};
  const toFetchIds = [];

  // first let's check if we have a larger tile that contains this one
  for (const tileId of tileIds) {
    let [zoomLevel, tileX] = tileId.split('.');
    let tilesetInfo = tilesetInfos[uid];
    let found = false;

    if (!tilesetInfo) {
      // This can happen when track options change and a new BAMDataFetcher is created.
      // We don't have a tileset info but we're fetching a track.
      tilesetInfo = await serverTilesetInfo(uid);
    }

    const [xStart, xEnd] = tilesetInfoToStartEnd(tilesetInfo, zoomLevel, tileX);

    while (zoomLevel > 0) {
      // Here we're checking if we've already fetched a larger tile.
      // Because larger tiles are superset of the smaller tiles (in the case of pileups)
      // if we have the larger tile, we don't need to refetch the smaller tile
      const hereTileId = `${uid}.${zoomLevel}.${tileX}`;

      if (tileValues.has(hereTileId)) {
        // We do have the larger tile.
        // Let's downsample the reads that would be present in the smaller tile
        // and squirrel those away until the end of the function when we'll return
        // them to the requester
        existingTiles[tileId] = tileValues
          .get(hereTileId)
          .filter((x) => xStart < x.to && xEnd > x.from);
        existingTiles[tileId].tilePositionId = tileId;
        tileValues.set(`${uid}.${tileId}`, existingTiles[tileId]);
        found = true;
        break;
      }

      zoomLevel -= 1;
      tileX = Math.floor(tileX / 2);
    }

    if (!found) {
      toFetchIds.push(tileId);
    }
  }

  const serverTileIds = toFetchIds.map(
    (x) => `d=${serverInfo.tilesetUid}.${x}`,
  );

  const urls = serverTileIds.map(
    (tileId) => `${serverInfos[uid].server}/tiles/?${tileId}`,
  );

  const promises = urls.map((url) => {
    return authFetch(url, uid)
      .then((d) => d.json())
      .then((rt) => {
        const newTiles = {};

        for (const tileId of tileIds) {
          const hereTileId = `${uid}.${tileId}`;
          const fullTileId = `${serverInfo.tilesetUid}.${tileId}`;
          if (rt[fullTileId]) {
            let rowJsonTile = rt[fullTileId];

            if (!rt[fullTileId].error) {
              if (rt[fullTileId].length) {
                // This is an expanded server tile typically produced by
                // pileup datasets rather than by BAM-backed datasets
                rowJsonTile = rt[fullTileId].map(x => addClippingAdjustments(x))
              } else {
               rowJsonTile = tabularJsonToRowJson(rt[fullTileId]);
              }
            }

            rowJsonTile.tilePositionId = tileId;
            newTiles[tileId] = rowJsonTile;

            tileValues.set(hereTileId, rowJsonTile);
          }
        }

        const toRet = { ...newTiles };
        return toRet;
      });
  });

  return Promise.all(promises).then((values) => {
    let toRet = { ...existingTiles };

    for (const value of values) {
      toRet = { ...toRet, ...value };
    }

    return toRet;
  });
};

const fetchTilesDebounced = async (uid, tileIds) => {
  const tiles = {};

  const validTileIds = [];
  const tilePromises = [];

  for (const tileId of tileIds) {
    const parts = tileId.split('.');
    const z = Number.parseInt(parts[0], 10);
    const x = Number.parseInt(parts[1], 10);

    if (Number.isNaN(x) || Number.isNaN(z)) {
      console.warn('Invalid tile zoom or position:', z, x);
      continue;
    }

    validTileIds.push(tileId);
    tilePromises.push(tile(uid, z, x));
  }

  return Promise.all(tilePromises).then((values) => {
    for (let i = 0; i < values.length; i++) {
      const validTileId = validTileIds[i];
      tiles[validTileId] = values[i];
      tiles[validTileId].tilePositionId = validTileId;
    }

    return tiles;
  });
};

///////////////////////////////////////////////////
/// Render Functions
///////////////////////////////////////////////////

// See segmentsToRows concerning the role of occupiedSpaceInRows
function assignSectionToRow(
  section,
  occupiedSpaceInRows,
  padding,
  trackOptions,
) {
  const viewAsPairs = trackOptions.viewAsPairs;
  const segmentFromWithPadding = section.fromWithClipping - padding;
  const segmentToWithPadding = section.toWithClipping + padding;

  // no row has been assigned - find a suitable row and update the occupied space
  if (section.row === null || section.row === undefined) {
    // Fast path: if the new segment overlaps with every existing row there is
    // no point scanning — a new row is the only option.
    //
    // A row can fit the segment only if:
    //   (a) segmentToWithPadding  < row.from  (segment ends before row starts), OR
    //   (b) segmentFromWithPadding > row.to   (segment starts after row ends)
    //
    // Neither can be true for ANY row when:
    //   segmentToWithPadding  >= max(row.from) [_maxFrom] — rules out (a) for all rows
    //   segmentFromWithPadding <= min(row.to)  [_minTo]   — rules out (b) for all rows
    if (
      occupiedSpaceInRows.length > 0 &&
      segmentToWithPadding >= occupiedSpaceInRows._maxFrom &&
      segmentFromWithPadding <= occupiedSpaceInRows._minTo
    ) {
      section.row = occupiedSpaceInRows.length;
      occupiedSpaceInRows.push({ from: segmentFromWithPadding, to: segmentToWithPadding });
      occupiedSpaceInRows._maxFrom = Math.max(occupiedSpaceInRows._maxFrom, segmentFromWithPadding);
      occupiedSpaceInRows._minTo = Math.min(occupiedSpaceInRows._minTo, segmentToWithPadding);
      return;
    }

    // Go through each row and look if there is space for the segment
    for (let i = 0; i < occupiedSpaceInRows.length; i++) {
      if (!occupiedSpaceInRows[i]) {
        // This row has free space
        occupiedSpaceInRows[i] = {
          from: segmentFromWithPadding,
          to: segmentToWithPadding,
        };
        section.row = i;
        return;
      }
      const rowSpaceFrom = occupiedSpaceInRows[i].from;
      const rowSpaceTo = occupiedSpaceInRows[i].to;
      if (segmentToWithPadding < rowSpaceFrom) {
        section.row = i;

        occupiedSpaceInRows[i] = {
          from: segmentFromWithPadding,
          to: rowSpaceTo,
        };
        return;
      } else if (segmentFromWithPadding > rowSpaceTo) {
        section.row = i;

        occupiedSpaceInRows[i] = {
          from: rowSpaceFrom,
          to: segmentToWithPadding,
        };
        return;
      }
    }
    // There is no space in the existing rows, so add a new one.
    section.row = occupiedSpaceInRows.length;

    occupiedSpaceInRows.push({
      from: segmentFromWithPadding,
      to: segmentToWithPadding,
    });
    occupiedSpaceInRows._maxFrom = Math.max(occupiedSpaceInRows._maxFrom, segmentFromWithPadding);
    occupiedSpaceInRows._minTo = Math.min(occupiedSpaceInRows._minTo, segmentToWithPadding);
  }
  // segment already has a row - just update the occupied space
  else {
    const assignedRow = section.row;
    if (occupiedSpaceInRows[assignedRow]) {
      const rowSpaceFrom = occupiedSpaceInRows[assignedRow].from;
      const rowSpaceTo = occupiedSpaceInRows[assignedRow].to;
      occupiedSpaceInRows[assignedRow] = {
        from: Math.min(segmentFromWithPadding, rowSpaceFrom),
        to: Math.max(segmentToWithPadding, rowSpaceTo),
      };
    } else {
      occupiedSpaceInRows[assignedRow] = {
        from: segmentFromWithPadding,
        to: segmentToWithPadding,
      };
    }
  }
}

function sectionsToRows(sections, optionsIn, trackOptions) {
  const { prevRows, padding } = Object.assign(
    { prevRows: [], padding: 5 },
    optionsIn || {},
  );
  const viewAsPairs = trackOptions.viewAsPairs;

  // The following array contains elements fo the form
  // occupiedSpaceInRows[i] = {from: 100, to: 110}
  // This means that in row i, the space from 100 to 110 is occupied and reads cannot be placed there
  // This array is updated with every section that is added to the scene
  const occupiedSpaceInRows = [];
  // _maxFrom / _minTo track the max row.from and min row.to across all rows.
  // They are only updated when a new row is pushed (never when an existing row
  // is updated), which keeps them conservatively correct: they may over-report
  // _maxFrom or under-report _minTo, but never in a direction that could make
  // the fast path in assignSectionToRow produce an incorrect result.
  occupiedSpaceInRows._maxFrom = -Infinity;
  occupiedSpaceInRows._minTo = Infinity;
  const sectionIds = new Set(sections.map((x) => x.id));

  // We only need those previous sections, that are in the current sections list
  // We will assume that prevRows is already sorted by base so we won't modify it
  const prevSections = prevRows
    .flat()
    .filter((section) => sectionIds.has(section.id));

  // If there's prevSections, we'll assume that they're already sorted the way
  // they should be because any change in the options would have caused a rerender

  for (let i = 0; i < prevSections.length; i++) {
    // prevSections contains already assigned sections. The function below therefore just
    // builds the occupiedSpaceInRows array. For this, prevSections does not need to be sorted
    assignSectionToRow(
      prevSections[i],
      occupiedSpaceInRows,
      padding,
      trackOptions,
    );
  }

  const prevSectionIds = new Set(prevSections.map((x) => x.id));
  let filteredSections = sections.filter((x) => !prevSectionIds.has(x.id));

  // Clear any pre-assigned row values carried from server tiles (http-tiles).
  // createSection() now propagates segment.row so that assignSectionToRow can
  // use the O(1) fast path when re-using prevRows, but new sections must have
  // their rows computed fresh — otherwise sort-by-base has no visual effect.
  for (const section of filteredSections) {
    section.row = null;
  }

  let sortedSections = [];
  if (trackOptions.sortByBase) {
    // We need to assign the sections to the rows that intersect the
    // sorted base first.
    sortedSections = groupSectionsBySortedBase(
      filteredSections,
      trackOptions.sortByBase,
    );

    for (const section of sortedSections) {
      assignSectionToRow(section, occupiedSpaceInRows, padding, trackOptions);
      prevSectionIds.add(section.id);
    }
  }

  // Filter again to remove sections which were rendered due to sorting
  filteredSections = sections.filter((x) => !prevSectionIds.has(x.id));

  let newSections = [];
  // We need to assign rows only to those sections, that are not in the prevSections list

  if (prevSections.length === 0) {
    filteredSections.sort(segmentsSort);
    filteredSections.forEach((section) => {
      assignSectionToRow(section, occupiedSpaceInRows, padding, trackOptions);
    });
    newSections = filteredSections;
  } else {
    // We subdivide the sections into those that are left/right of the existing previous segments
    // Note that prevSections is sorted

    // Use the median middle of the currently occupied space as the cutoff
    // for left / right reads
    const mids = [];
    for (let i = 0; i < occupiedSpaceInRows.length; i++) {
      const region = occupiedSpaceInRows[i];
      if (region) {
        mids.push((region.from + region.to) / 2);
      }
    }

    mids.sort();
    const cutoff = mids[Math.floor(mids.length / 2)];

    const newSectionsLeft = filteredSections.filter(
      (x) => x.fromWithClipping <= cutoff,
    );
    // The sort order for new sections that are appended left is reversed
    newSectionsLeft.sort((a, b) => b.fromWithClipping - a.fromWithClipping);
    newSectionsLeft.forEach((section) => {
      assignSectionToRow(section, occupiedSpaceInRows, padding, trackOptions);
    });

    const newSectionsRight = filteredSections.filter(
      (x) => x.fromWithClipping > cutoff,
    );
    newSectionsRight.sort((a, b) => a.fromWithClipping - b.fromWithClipping);
    newSectionsRight.forEach((section) => {
      assignSectionToRow(section, occupiedSpaceInRows, padding, trackOptions);
    });

    newSections = newSectionsLeft.concat(
      prevSections,
      newSectionsRight,
      viewAsPairs,
    );
  }

  // Build outputRows by bucketing sections into their assigned row.
  // The previous approach did a .filter() over all sections for each row,
  // which is O(n²) — catastrophic for dense pileups where every read gets
  // its own row. A single forward pass over both arrays is O(n).
  const outputRows = Array.from({ length: occupiedSpaceInRows.length }, () => []);
  for (const section of newSections) {
    if (section.row != null) outputRows[section.row].push(section);
  }
  for (const section of sortedSections) {
    if (section.row != null) outputRows[section.row].push(section);
  }

  return outputRows;
}


// how we sort segments
const segmentsSort = (a, b) => a.fromWithClipping - b.fromWithClipping;

// A section is a group of segments that should be rendered
// together on one row. Segments are typically reads whereas
// Sections are read pairs.
const createSection = (segments) => {
  // strands always seem to be mismatched among mates
  // let strand = segments[0].strand;
  // for (let i = 0; i < segments.length; i++) {
  //   if (segments[i].strand != strand) {
  //     console.log('Mismatched strand in section', segments);
  //   }
  // }
  return {
    fromWithClipping: Math.min(...segments.map((x) => x.fromWithClipping)),
    toWithClipping: Math.max(...segments.map((x) => x.toWithClipping)),
    id: segments.map((x) => x.id.toString()).join('.'),
    segments: segments.sort(segmentsSort),
    // If the tile data already contains a pre-assigned row, carry it through so
    // that assignSectionToRow can skip its O(n) linear scan and use the O(1)
    // fast path instead. This turns overall row-assignment from O(n²) to O(n)
    // for pre-computed tile data (e.g. http-tiles).
    row: segments[0].row != null ? segments[0].row : null,
    // strand: segments[0].strand,
  };
};

const renderSegments = (
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  trackOptions,
) => {
  const prevRows = prevRowsByUid[uid] || {};
  const allSegments = {};
  let allReadCounts = {};
  let coverageSamplingDistance;

  const tsInfo = tilesetInfos[uid];

  for (const tileId of tileIds) {
    const tileValue = tileValues.get(`${uid}.${tileId}`);

    if (tileValue.error) {
      throw new Error(tileValue.error);
    }

    for (const segment of tileValue) {
      allSegments[segment.id] = segment;
    }
  }

  let segmentList = Object.values(allSegments);

  if (trackOptions.minMappingQuality > 0) {
    segmentList = segmentList.filter(
      (s) => s.mapq >= trackOptions.minMappingQuality,
    );
  }

  let sections = [];

  if (areMatesRequired(trackOptions)) {
    const segmentsByReadName = findMates(segmentList);
    prepareHighlightedReads(segmentList, trackOptions);
    sections = Object.values(segmentsByReadName).map(createSection);
  } else {
    sections = segmentList.map((x) => createSection([x]));
  }

  // At this point reads are colored correctly, but we only want to align those reads that
  // are within the visible tiles - not mates that are far away, as this can mess up the alignment
  let tileMinPos = Number.MAX_VALUE;
  let tileMaxPos = -Number.MAX_VALUE;

  tileIds.forEach((id) => {
    const z = id.split('.')[0];
    const x = id.split('.')[1];
    const startEnd = tilesetInfoToStartEnd(tsInfo, +z, +x);
    tileMinPos = Math.min(tileMinPos, startEnd[0]);
    tileMaxPos = Math.max(tileMaxPos, startEnd[1]);
  });

  for (let i = 0; i < segmentList.length; i++) {
    const segment = segmentList[i];

    if (segment.to >= tileMinPos && segment.from <= tileMaxPos) {
      segment.in_bounds = true;
    } else {
      segment.in_bounds = false;
    }
  }

  let [minPos, maxPos] = [Number.MAX_VALUE, -Number.MAX_VALUE];

  for (let i = 0; i < segmentList.length; i++) {
    if (segmentList[i].in_bounds) {
      if (segmentList[i].from < minPos) {
        minPos = segmentList[i].from;
      }

      if (segmentList[i].to > maxPos) {
        maxPos = segmentList[i].to;
      }
    }
  }
  let grouped = null;

  // group by some attribute or don't
  if (groupBy) {
    // we should only be able to group by things that are common across
    // across all segments in a section.
    let groupByOption = trackOptions && trackOptions.groupBy;
    groupByOption = groupByOption ? groupByOption : null;
    grouped = groupBy(sections, groupByOption);
  } else {
    grouped = { null: sections };
  }
  // calculate the the rows of reads for each group
  for (const key of Object.keys(grouped)) {
    const rows = sectionsToRows(
      grouped[key],
      {
        prevRows: (prevRows[key] && prevRows[key].rows) || [],
      },
      trackOptions,
    );

    for (const row of rows) {
      for (const section of row) {
        for (const segment of section.segments) {
          segment.row = section.row;
        }
      }
    }
    // At this point grouped[key] also contains all the segments (as array), but we only need grouped[key].rows
    // Therefore we get rid of everything else to save memory and increase performance
    grouped[key] = {};
    grouped[key].rows = rows;
  }

  // calculate the height of each group
  const totalRows = Object.values(grouped)
    .map((x) => x.rows.length)
    .reduce((a, b) => a + b, 0);

  // Reserve fixed pixel space for coverage at the top
  const coveragePixelHeight = trackOptions.showCoverage ? trackOptions.coverageHeight : 0;
  const readsStartPixel = coveragePixelHeight;

  let currStart = 0;

  // const d = range(0, rows.length);
  const yGlobalScale = scaleBand()
    .domain(range(0, totalRows))
    .range([readsStartPixel, dimensions[1]])
    .paddingInner(0.2);

  // Reset fill counters. The module-level allPositions/allColors/allIndexes
  // buffers are reused from the previous render (growing if needed, never freed).
  let currPosition = 0;
  let currColor = 0;
  let currIdx = 0;

  // Inlined addRect: writes positions, colors, and triangle indices directly
  // without intermediate function calls. This is the hot path (1.6M calls per render).
  const addRect = (x, y, width, height, colorIdx) => {
    const xRight = x + width;
    const yBottom = y + height;
    const ix0 = currPosition >> 1; // base vertex index for this rect's 4 vertices

    if (currPosition + 8 > allPositionsLength) {
      allPositionsLength *= 2;
      console.log(`[addRect] positions realloc → ${(allPositionsLength * 4 / 1e6).toFixed(0)}MB (${currPosition >> 3} rects so far)`);
      const prev = allPositions;
      allPositions = new Float32Array(allPositionsLength);
      allPositions.set(prev);
    }
    allPositions[currPosition++] = x;      allPositions[currPosition++] = y;
    allPositions[currPosition++] = xRight; allPositions[currPosition++] = y;
    allPositions[currPosition++] = x;      allPositions[currPosition++] = yBottom;
    allPositions[currPosition++] = xRight; allPositions[currPosition++] = yBottom;

    if (currColor + 4 > allColorsLength) {
      allColorsLength *= 2;
      console.log(`[addRect] colors realloc → ${(allColorsLength * 4 / 1e6).toFixed(0)}MB`);
      const prev = allColors;
      allColors = new Float32Array(allColorsLength);
      allColors.set(prev);
    }
    allColors[currColor++] = colorIdx;
    allColors[currColor++] = colorIdx;
    allColors[currColor++] = colorIdx;
    allColors[currColor++] = colorIdx;

    if (currIdx + 6 > allIndexesLength) {
      allIndexesLength *= 2;
      console.log(`[addRect] indexes realloc → ${(allIndexesLength * 4 / 1e6).toFixed(0)}MB`);
      const prev = allIndexes;
      allIndexes = new Int32Array(allIndexesLength);
      allIndexes.set(prev);
    }
    allIndexes[currIdx++] = ix0;     allIndexes[currIdx++] = ix0 + 1; allIndexes[currIdx++] = ix0 + 2;
    allIndexes[currIdx++] = ix0 + 2; allIndexes[currIdx++] = ix0 + 3; allIndexes[currIdx++] = ix0 + 1;
  };

  const xScale = scaleLinear().domain(domain).range(scaleRange);

  let groupCounter = 0;
  const groupKeys = Object.keys(grouped).sort();

  for (const key of groupKeys) {
    grouped[key].start = yGlobalScale(currStart);
    currStart += grouped[key].rows.length;
    grouped[key].end = yGlobalScale(currStart - 1) + yGlobalScale.bandwidth();
    const lineHeight = yGlobalScale.step() - yGlobalScale.bandwidth();

    // addRect(0, grouped[key].end, dimensions[0], lineHeight, PILEUP_COLOR_IXS.BLACK);

    if (groupCounter % 2) {
      // addRect(
      //   0,
      //   grouped[key].start,
      //   xScale(maxPos) - xScale(minPos),
      //   grouped[key].end - grouped[key].start,
      //   PILEUP_COLOR_IXS.BLACK_05
      // );
    }

    groupCounter += 1;
  }

  if (trackOptions.showCoverage) {
    const maxCoverageSamples = 10000;
    coverageSamplingDistance = Math.max(
      Math.floor((maxPos - minPos) / maxCoverageSamples),
      1,
    );
    const result = getCoverage(
      uid,
      segmentList.filter((x) => x.in_bounds),
      coverageSamplingDistance,
    );

    allReadCounts = result.coverage;
    const maxReadCount = result.maxCoverage;

    // Coverage uses fixed pixel height at the top of the track
    let xLeft, yTop, barHeight;
    let bgColor = PILEUP_COLOR_IXS.BG_MUTED;
    const width = (xScale(1) - xScale(0)) * coverageSamplingDistance;
    const groupHeight = coveragePixelHeight;
    const scalingFactor = groupHeight / maxReadCount;

    for (const pos of Object.keys(allReadCounts)) {
      xLeft = xScale(pos);
      yTop = groupHeight;

      // Draw rects for variants counts on top of each other
      for (const variant of Object.keys(allReadCounts[pos]['variants'])) {
        barHeight = allReadCounts[pos]['variants'][variant] * scalingFactor;
        yTop -= barHeight;
        // When the coverage is not exact, we don't color variants.
        const variantColor =
          coverageSamplingDistance === 1 ? PILEUP_COLOR_IXS[variant] : bgColor;
        addRect(xLeft, yTop, width, barHeight, variantColor);
      }

      barHeight = allReadCounts[pos]['matches'] * scalingFactor;
      yTop -= barHeight;
      if (coverageSamplingDistance === 1) {
        bgColor = pos % 2 === 0 ? PILEUP_COLOR_IXS.BG : PILEUP_COLOR_IXS.BG2;
      }

      addRect(xLeft, yTop, width, barHeight, bgColor);
    }
  }

  // Hoist per-render constants out of the inner loops.
  const isProtein = isProteinColorScale(trackOptions.colorScale);
  const insertionWidth = Math.max(1, xScale(0.2) - xScale(0));

  for (const group of Object.values(grouped)) {
    const { rows } = group;

    const d = range(0, rows.length);
    const r = [group.start, group.end];

    const yScale = scaleBand().domain(d).range(r).paddingInner(0.2);

    let xLeft;
    let xRight;
    let yTop;
    let yBottom;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      yTop = yScale(i);
      const height = yScale.bandwidth();
      yBottom = yTop + height;

      for (let j = 0; j < row.length; j++) {
        const section = row[j];
        for (let k = 0; k < section.segments.length; k++) {
          const segment = section.segments[k];
          const from = xScale(segment.from);
          const to = xScale(segment.to);

          xLeft = from;
          xRight = to;

          addRect(
            xLeft,
            yTop,
            xRight - xLeft,
            height,
            segment.colorOverride || segment.color,
          );

          // Insertions are sorted to the end during fetch (addClippingAdjustments stage)
          // so they render on top of substitutions.
          for (const substitution of segment.substitutions) {
            xLeft = xScale(segment.from + substitution.pos);
            const width = Math.max(1, xScale(substitution.length) - xScale(0));
            xRight = xLeft + width;

            if (substitution.type === 'I') {
              addRect(xLeft - insertionWidth / 2, yTop, insertionWidth, height, PILEUP_COLOR_IXS.I);
            } else if (substitution.variant) {
              const colorKey = isProtein
                ? SINGLE_TO_THREE_LETTER_AA[substitution.variant] || substitution.variant
                : substitution.variant;
              
              if (colorKey && PILEUP_COLOR_IXS[colorKey] !== undefined) {
                addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS[colorKey]);
              } else {
                addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.BLACK);
              }
            } else if (substitution.type === 'S') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.S);
            } else if (substitution.type === 'H') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.H);
            } else if (substitution.type === 'X') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.X);
            } else if (substitution.type === 'D') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.D);

              // add some stripes
              const numStripes = 6;
              const stripeWidth = 0.1;
              for (let i = 0; i <= numStripes; i++) {
                const xStripe = xLeft + (i * width) / numStripes;
                addRect(
                  xStripe,
                  yTop,
                  stripeWidth,
                  height,
                  PILEUP_COLOR_IXS.BLACK,
                );
              }
            } else if (substitution.type === 'N') {
              // deletions so we're going to draw a thinner line
              // across
              const xMiddle = (yTop + yBottom) / 2;
              const delWidth = Math.min((yBottom - yTop) / 4.5, 1);

              const yMidTop = xMiddle - delWidth / 2;
              const yMidBottom = xMiddle + delWidth / 2;

              addRect(
                xLeft,
                yTop,
                xRight - xLeft,
                yMidTop - yTop,
                PILEUP_COLOR_IXS.N,
              );
              addRect(
                xLeft,
                yMidBottom,
                width,
                yBottom - yMidBottom,
                PILEUP_COLOR_IXS.N,
              );

              const DASH_LENGTH = 6;
              const DASH_SPACE = 4;
              const MAX_DASHES = 30;

              // draw dashes, capped to MAX_DASHES so long introns at high zoom
              // don't generate thousands of rects per read
              const naturalStep = DASH_LENGTH + DASH_SPACE;
              const regionWidth = xRight - xLeft;
              const step = regionWidth / MAX_DASHES > naturalStep
                ? regionWidth / MAX_DASHES
                : naturalStep;

              let currPos = xLeft;
              while (currPos <= xRight) {
                // make sure the last dash doesn't overrun
                const dashLength = Math.min(DASH_LENGTH, xRight - currPos);

                addRect(
                  currPos,
                  yMidTop,
                  dashLength,
                  delWidth,
                  PILEUP_COLOR_IXS.N,
                );
                currPos += step;
              }
              // allready handled above
            } else {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.BLACK);
            }
          }
        }

        if (trackOptions.viewAsPairs) {
          for (let i = 1; i < section.segments.length; i++) {
            // draw the rects connecting read pairs
            const mate1End = xScale(section.segments[i - 1].toWithClipping);
            const mate2Start = xScale(section.segments[i].fromWithClipping);

            const mateConnectorStart = Math.min(mate2Start, mate1End);
            const mateConnectorEnd = Math.max(mate2Start, mate1End);

            addRect(
              mateConnectorStart,
              yTop + (7 * height) / 16,
              mateConnectorEnd - mateConnectorStart,
              height / 8,
              PILEUP_COLOR_IXS.BLACK_05,
            );
          }
        }
      }
    }
  }

  // Slice to exact size for transfer. The module-level buffers are retained
  // (they are NOT transferred) so the next render can reuse them without
  // reallocating. The slice cost is proportional to actual data size only.
  const positionsBuffer = allPositions.buffer.slice(0, currPosition * 4);
  const colorsBuffer    = allColors.buffer.slice(0, currColor * 4);
  const ixBuffer        = allIndexes.buffer.slice(0, currIdx * 4);

  // Cache the full grouped object in the worker so the next renderSegments call
  // can use it as prevRows without any main-thread round-trip.
  prevRowsByUid[uid] = grouped;

  // Send only the minimum the main thread needs for y-scale bands.
  // JS objects cannot be transferred zero-copy (only ArrayBuffers can), so we
  // keep this payload as small as possible — just {rowCount, start, end} per
  // group, which is a handful of numbers regardless of how many reads there are.
  // The full grouped data stays in prevRowsByUid[uid] inside the worker.
  const rowsMeta = {};
  for (const [key, group] of Object.entries(grouped)) {
    rowsMeta[key] = {
      rowCount: group.rows.length,
      start: group.start,
      end: group.end,
    };
  }

  const objData = {
    rowsMeta,
    coverage: allReadCounts,
    coverageSamplingDistance,
    positionsBuffer,
    colorsBuffer,
    ixBuffer,
    xScaleDomain: domain,
    xScaleRange: scaleRange,
  };

  return Transfer(objData, [objData.positionsBuffer, colorsBuffer, ixBuffer]);
};

const resetPrevRows = (uid) => {
  delete prevRowsByUid[uid];
};

/**
 * Lightweight hit-test that returns the segment (read) at a given genomic
 * position within a specific row, or null if no read covers that position.
 * All data lives in prevRowsByUid so no serialization of the full tile data
 * is needed; only the matched segment object is transferred.
 */
const getReadAtPosition = (uid, groupKey, rowIndex, genomicPos) => {
  const grouped = prevRowsByUid[uid];
  if (!grouped || !grouped[groupKey]) return null;
  const rows = grouped[groupKey].rows;
  if (rowIndex < 0 || rowIndex >= rows.length) return null;
  const row = rows[rowIndex];
  for (const section of row) {
    for (const segment of section.segments) {
      if (segment.from <= genomicPos && genomicPos <= segment.to) {
        return segment;
      }
    }
  }
  return null;
};

/**
 * Get reads suitable for text labeling.
 * Returns an array of read data for all visible reads within the domain.
 * Prioritizes previously visible reads to maintain label stability.
 *
 * @param {string} uid - Track UID
 * @param {Array<number>} domain - [minPos, maxPos] genomic domain
 * @param {number} maxReads - Maximum number of reads to return (default: 500)
 * @param {Array<string>} priorityReadIds - Read IDs to prioritize (previously visible)
 * @returns {Array} Array of read objects with { id, readName, from, to, row, groupKey, mapq, strand }
 */
/**
 * Fisher-Yates shuffle algorithm for randomizing array order
 */
const shuffle = (array) => {
  const shuffled = [...array]; // Create a copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getReadsForLabeling = (uid, domain, maxReads = 500, priorityReadIds = []) => {
  const grouped = prevRowsByUid[uid];
  if (!grouped) return [];

  const [minPos, maxPos] = domain;
  const prioritySet = new Set(priorityReadIds.map(id => String(id)));
  const priorityReads = [];
  const otherReads = [];

  const TEST_READ = '196850524';
  const testInPriority = prioritySet.has(TEST_READ);
  let testReadFound = false;

  // First pass: collect ALL priority reads and ALL other reads in visible domain
  for (const groupKey in grouped) {
    const group = grouped[groupKey];
    const rows = group.rows;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      for (const section of row) {
        for (const segment of section.segments) {
          // Check if read overlaps the visible domain
          if (segment.to >= minPos && segment.from <= maxPos) {
            const readData = {
              id: segment.id,
              readName: segment.readName,
              from: segment.from,
              to: segment.to,
              row: rowIndex,
              groupKey: groupKey,
              mapq: segment.mapq,
              strand: segment.strand,
              chrName: segment.chrName,
              chrOffset: segment.chrOffset || 0,
            };

            if (String(segment.id) === TEST_READ) {
              testReadFound = true;
            }

            // Separate priority reads from others
            if (prioritySet.has(String(segment.id))) {
              priorityReads.push(readData);
              prioritySet.delete(String(segment.id)); // Remove to track what's found
            } else {
              // Collect ALL other reads (we'll shuffle and slice later)
              otherReads.push(readData);
            }
          }
        }
      }
    }
  }

  if (testInPriority) {
    console.log('[WORKER TEST] Read', TEST_READ, 'was in priority, found in tiles?', testReadFound,
      'in result?', priorityReads.some(r => String(r.id) === TEST_READ));
  }

  // Shuffle non-priority reads for random distribution, then select up to maxReads
  const shuffledOthers = shuffle(otherReads);
  const combined = [...priorityReads, ...shuffledOthers.slice(0, maxReads - priorityReads.length)];
  return combined;
};

const tileFunctions = {
  init,
  localInit,
  httpInit,
  serverInit,
  tilesetInfo,
  localTilesetInfo,
  httpTilesetInfo,
  serverTilesetInfo,
  localFetchTilesDebounced,
  httpFetchTilesDebounced,
  serverFetchTilesDebounced,
  fetchTilesDebounced,
  tile,
  renderSegments,
  resetPrevRows,
  getReadAtPosition,
  getReadsForLabeling,
};

expose(tileFunctions);
