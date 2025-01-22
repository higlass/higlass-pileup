import { group, range } from 'd3-array';
import { scaleLinear, scaleBand } from 'd3-scale';
import { format } from 'd3-format';
import { expose, Transfer } from 'threads/worker';
// import { BamFile } from 'apr144-bam';
import { BamFile } from '@gmod/bam';
import {
  getSubstitutions,
  calculateInsertSize,
  areMatesRequired,
  getMethylationOffsets,
  getFibertoolsFIREMSPOffsets,
  getFibertoolsFIRENucleosomeOffsets,
  hexToRGBRawTriplet,
  indexDHSColors,
  // fireColors,
  genericBedColors,
} from './bam-utils';
import LRU from 'lru-cache';
import { PILEUP_COLOR_IXS, replaceColorIdxs, appendColorIdxs } from './bam-utils';
import { parseChromsizesRows, ChromosomeInfo } from './chrominfo-utils';
// import BAMDataFetcher from './bam-fetcher';
import { clusterData, euclideanDistance, jaccardDistance, averageDistance } from 'apr144-hclust';
import { RemoteFile } from 'generic-filehandle';
import { phylotree } from "phylotree";

const dbscan = require('apr144-dbscan');

function convertAgnesClusterResultsToNewickString(agnesClusterResults) {
  const hclustToNewick = (node, suffix) => {
    let newick = '';
    const children = node.children;
    let childless = false;
    let siblings = [];
    for (let i = 0; i < children.length; i++) {
      if (children[i].children) {
        // console.log(`has-child [A] | ${JSON.stringify(children[i])} | ${suffix}\n`);
        newick += hclustToNewick(children[i], `:${children[i].height}`);
      }
      else {
        // console.log(`childless [B] | ${JSON.stringify(children[i])} \n`);
        siblings.push(children[i]);
        childless = true;
      }
    }
    if (childless) {
      // flatten siblings
      // console.log(`merging A | ${JSON.stringify(siblings)} \n`);
      newick += '(';
      for (let i = 0; i < siblings.length; i++) {
        for (let j = 0; j < siblings[i].indexes.length; j++) {
          newick += `'${siblings[i].indexes[j]}':${siblings[i].height},`;
        }
      }
      newick = newick.slice(0, -1);
      newick += ')';
      siblings.length = 0;
    }
    return `(${newick}${suffix})`;
  }
  const newick = hclustToNewick(agnesClusterResults, `:${agnesClusterResults.height}`);
  return newick;
}

function isInt(number) {
  if (!/^["|']{0,1}[-]{0,1}\d{0,}(\.{0,1}\d+)["|']{0,1}$/.test(number)) return false;
  return !(number - parseInt(number));
}

function fibertreeViewPhylotreeBranchDataToOrderedList(branch) {
  let orderedList = [];
  let stack = [branch];
  while (stack.length > 0) {
    let node = stack.pop();
    if (node.children) {
      stack.push(...node.children);
    }
    if (isInt(node.name)) orderedList.push(parseInt(node.name));
    // orderedList.push(parseInt(node.name));
    // orderedList.push(node.name);
  }
  return orderedList;
}

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

const groupSectionsBySortedBase = (sections, sortByBase) => {
  // This function will take a set of sections and partition them
  // into groups of sections and return them in some order

  // We'll assume that all sections are on the same chromosome as the
  // sortByBase position

  // sectionGroups will store the groups of sections for each base
  // type at the sort by position
  const sectionGroups = {};

  for (let section of sections) {
    let overlapBase = null;

    for (let segment of section.segments) {
      if (
        segment.chrName == sortByBase.chr &&
        segment.from - segment.chrOffset <= sortByBase.pos &&
        sortByBase.pos <= segment.to - segment.chrOffset
      ) {
        // The read overlaps the sortByBase position

        // The following loop could be replaced by a binary search
        // if the substitutions were sorted
        for (let substitution of segment.substitutions) {
          if (
            substitution.variant &&
            segment.from - segment.chrOffset + substitution.pos ==
              sortByBase.pos
          ) {
            overlapBase = substitution.variant;
            break;
          }
        }

        if (sectionGroups[overlapBase]) {
          sectionGroups[overlapBase].push(section);
        } else {
          sectionGroups[overlapBase] = [section];
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
  for (let base of sortedBases) {
    toReturn = toReturn.concat(sectionGroups[base]);
  }

  return toReturn;
};

const bamRecordToJson = (bamRecord, chrName, chrOffset, trackOptions, basicSegmentAttributesOnly) => {
  // const seq = bamRecord.get('seq'); // pre-v3 bam-js API
  const seq = bamRecord.seq;
  // const from = +bamRecord.get('start') + 1 + chrOffset; // pre-v3 bam-js API
  const from = bamRecord.start + 1 + chrOffset;
  // const to = +bamRecord.get('end') + 1 + chrOffset; // pre-v3 bam-js API
  const to = bamRecord.end + 1 + chrOffset;

  const segment = {
    // id: bamRecord.get('id'), // pre-v3 bam-js API
    id: bamRecord.id,
    mate_ids: [], // split reads can have multiple mates
    // start: +bamRecord.get('start') + 1, // pre-v3 bam-js API
    start: bamRecord.start + 1,
    from: from,
    to: to,
    length: to - from - 1,
    fromWithClipping: from,
    toWithClipping: to,
    // md: bamRecord.get('MD'), // pre-v3 bam-js API
    md: bamRecord.tags.MD,
    // sa: bamRecord.get('SA'), // Needed to determine if this is a split read // pre-v3 bam-js API
    sa: bamRecord.tags.SA, // Needed to determine if this is a split read
    chrName,
    chrOffset,
    // cigar: bamRecord.get('cigar'), // pre-v3 bam-js API
    cigar: bamRecord.CIGAR,
    // mapq: bamRecord.get('mq'), // pre-v3 bam-js API
    mapq: bamRecord.qual,
    // strand: bamRecord.get('strand') === 1 ? '+' : '-', // pre-v3 bam-js API
    strand: (bamRecord.flags & 16) ? '-' : '+',
    row: null,
    // readName: bamRecord.get('name'),
    readName: bamRecord.name,
    seq: seq,
    color: PILEUP_COLOR_IXS.BG,
    colorOverride: null,
    mappingOrientation: null,
    substitutions: [],
    methylationOffsets: [],
    mspOffsets: [],
    nucOffsets: [],
    // mm: bamRecord.get('MM'), // pre-v3 bam-js API
    // ml: bamRecord.get('ML'), // pre-v3 bam-js API
    // as: bamRecord.get('as'), // pre-v3 bam-js API
    // al: bamRecord.get('al'), // pre-v3 bam-js API
    // aq: bamRecord.get('aq'), // pre-v3 bam-js API
    // ns: bamRecord.get('ns'), // pre-v3 bam-js API
    // nl: bamRecord.get('nl'), // pre-v3 bam-js API
    MM: bamRecord.tags.MM,
    ML: bamRecord.tags.ML,
    as: bamRecord.tags.as,
    al: bamRecord.tags.al,
    aq: bamRecord.tags.aq,
    ns: bamRecord.tags.ns,
    nl: bamRecord.tags.nl,
  };

  if (basicSegmentAttributesOnly) {
    return segment;
  }

  if (segment.strand === '+' && trackOptions && trackOptions.plusStrandColor) {
    segment.color = PILEUP_COLOR_IXS.PLUS_STRAND;
  }
  else if (segment.strand === '-' && trackOptions && trackOptions.minusStrandColor) {
    segment.color = PILEUP_COLOR_IXS.MINUS_STRAND;
  }

  const includeClippingOps = true;
  const reverseCIGAROps = (trackOptions && trackOptions.ftFire && segment.strand === '-');

  segment.substitutions = getSubstitutions(segment, seq, includeClippingOps, reverseCIGAROps);

  if (trackOptions.methylation) {
    segment.methylationOffsets = getMethylationOffsets(segment, seq, trackOptions.methylation.alignCpGEvents);
    // console.log(`segment.methylationOffsets | ${JSON.stringify(segment.methylationOffsets)}`);
  }

  if (trackOptions.fire) {
    // segment.metadata = JSON.parse(bamRecord.get('CO'));
    segment.metadata = JSON.parse(bamRecord.tags.CO);
    // segment.fireColors = fireColors(trackOptions);
    // const newPileupColorIdxs = {};
    // const highlightOffset = (trackOptions && trackOptions.methylation && trackOptions.methylation.hideSubstitutions && trackOptions.methylation.highlights && 'M0A' in trackOptions.methylation.highlights) ? 1 : 0;
    // Object.keys(segment.fireColors).map((x, i) => {
    //   newPileupColorIdxs[x] = i; // + highlightOffset;
    //   return null;
    // });
    // replaceColorIdxs(newPileupColorIdxs);
    // appendColorIdxs(newPileupColorIdxs);
    segment.color = PILEUP_COLOR_IXS.FIRE_BG;
    // console.log(`PILEUP_COLOR_IXS ${JSON.stringify(PILEUP_COLOR_IXS)}`);
  }

  if (trackOptions.ftFire) {
    // const alignCpGEvents = true;
    // segment.methylationOffsets = getMethylationOffsets(segment, seq, alignCpGEvents);
    segment.mspOffsets = getFibertoolsFIREMSPOffsets(segment);
    segment.nucOffsets = getFibertoolsFIRENucleosomeOffsets(segment);
    segment.metadata = {};
    segment.color = PILEUP_COLOR_IXS.FIRE_BG;
  }

  if (trackOptions.tfbs) {
    // segment.metadata = JSON.parse(bamRecord.get('CO'));
    segment.metadata = JSON.parse(bamRecord.tags.CO);
  }

  if (trackOptions.genericBed) {
    // segment.metadata = JSON.parse(bamRecord.get('CO'));
    segment.metadata = JSON.parse(bamRecord.tags.CO);
    segment.genericBedColors = genericBedColors(trackOptions);
    const newPileupColorIdxs = {};
    Object.keys(segment.genericBedColors).map((x, i) => {
      newPileupColorIdxs[x] = i;
      return null;
    })
    replaceColorIdxs(newPileupColorIdxs);
  }

  if (trackOptions.indexDHS) {
    // segment.metadata = JSON.parse(bamRecord.get('CO'));
    segment.metadata = JSON.parse(bamRecord.tags.CO);
    // console.log(`trackOptions ${JSON.stringify(trackOptions)}`);
    segment.indexDHSColors = indexDHSColors(trackOptions);

    const newPileupColorIdxs = {};
    Object.keys(segment.indexDHSColors).map((x, i) => {
      newPileupColorIdxs[x] = i;
      return null;
    })
    replaceColorIdxs(newPileupColorIdxs);
    segment.color = PILEUP_COLOR_IXS.INDEX_DHS_BG;
  }

  let fromClippingAdjustment = 0;
  let toClippingAdjustment = 0;

  // We are doing this for row calculation, so that there is no overlap of clipped regions with regular ones
  for (const sub of segment.substitutions) {
    if ((sub.type === "S" || sub.type === "H") && sub.pos < 0) {
      fromClippingAdjustment = -sub.length;
    } else if ((sub.type === "S" || sub.type === "H") && sub.pos > 0) {
      toClippingAdjustment = sub.length;
    }
  }
  segment.fromWithClipping += fromClippingAdjustment;
  segment.toWithClipping += toClippingAdjustment;

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

// sequence data
const sequenceFiles = {};
const sequenceTileValues = new LRU({ max: MAX_TILES });

// indexed by uuid
const dataConfs = {};
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

const DEFAULT_DATA_OPTIONS = {
  maxTileWidth: 2e5,
};

const init = (uid, bamUrl, baiUrl, fastaUrl, faiUrl, chromSizesUrl, options, tOptions) => {
  if (!options) {
    dataOptions[uid] = DEFAULT_DATA_OPTIONS;
  } else {
    dataOptions[uid] = { ...DEFAULT_DATA_OPTIONS, ...options };
  }

  if (fastaUrl && faiUrl) {
    // console.log(`setting up fasta | ${fastaUrl} | ${faiUrl}`);
    const remoteFasta = new RemoteFile(fastaUrl);
    const remoteFai = new RemoteFile(faiUrl);
    const { IndexedFasta } = require('apr144-indexedfasta');
    sequenceFiles[fastaUrl] = new IndexedFasta({
      fasta: remoteFasta,
      fai: remoteFai,
    });
    // console.log(`set up sequence files | ${JSON.stringify(sequenceFiles)}`);
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

  if (!bamFiles[bamUrl]) {
    bamFiles[bamUrl] = new BamFile({
      bamUrl,
      baiUrl,
    });

    // we have to fetch the header before we can fetch data
    bamHeaders[bamUrl] = bamFiles[bamUrl].getHeader({assemblyName: 'hg38'});

    // const bamUrlObj = new URL(bamUrl)
    // const bamUrlUsername = bamUrlObj.username
    // const bamUrlPassword = bamUrlObj.password
    // const cleanBamUrl = `${bamUrlObj.protocol}//${bamUrlObj.host}${bamUrlObj.pathname}${bamUrlObj.search}`;
    // const cleanBaiUrl = `${bamUrlObj.protocol}//${bamUrlObj.host}${bamUrlObj.pathname}.bai${bamUrlObj.search}`;

    // if (bamUrlUsername && bamUrlPassword) {
    //   bamFiles[bamUrl] = new BamFile({
    //     bamFilehandle: new RemoteFile(cleanBamUrl, {
    //       overrides: {
    //         credentials: 'include',
    //         headers: {
    //           Authorization: 'Basic ' + btoa(bamUrlUsername + ':' + bamUrlPassword),
    //         },
    //       },
    //     }),
    //     baiFilehandle: new RemoteFile(cleanBaiUrl, {
    //       overrides: {
    //         credentials: 'include',
    //         headers: {
    //           Authorization: 'Basic ' + btoa(bamUrlUsername + ':' + bamUrlPassword),
    //         },
    //       },
    //     }),
    //   })
    // }
    // else {
    //   bamFiles[bamUrl] = new BamFile({
    //     bamUrl: bamUrl,
    //     baiUrl: baiUrl,
    //   });
    // }

    // bamHeaders[bamUrl] = bamFiles[bamUrl].getHeader();
  }

  dataConfs[uid] = {
    bamUrl,
    fastaUrl,
    chromSizesUrl,
  };

  trackOptions[uid] = tOptions;
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

  const { chromSizesUrl, bamUrl } = dataConfs[uid];

  // getCoverage potentiall get calles before the chromInfos finished loading
  // Exit the function in this case
  if (!chromInfos[chromSizesUrl]) {
    return {
      coverage: coverage,
      maxCoverage: maxCoverage,
    };
  }

  for (let j = 0; j < segmentList.length; j++) {
    const from = segmentList[j].from;
    const to = segmentList[j].to;
    // Find the first position that is in the sampling set
    const firstFrom = from - (from % samplingDistance) + samplingDistance;
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

  const absToChr = chromInfos[chromSizesUrl].absToChr;
  Object.entries(coverage).forEach(([pos, entry]) => {
    const from = absToChr(pos);
    let range = from[0] + ':' + format(',')(from[1]);
    if (samplingDistance > 1) {
      const to = absToChr(parseInt(pos, 10) + samplingDistance - 1);
      range += '-' + format(',')(to[1]);
    }
    entry.range = range;
  });

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

    const retVal = {
      tile_size: TILE_SIZE,
      bins_per_dimension: TILE_SIZE,
      max_zoom: Math.ceil(
        Math.log(chromInfo.totalLength / TILE_SIZE) / Math.log(2),
      ),
      max_width: chromInfo.totalLength,
      min_pos: [0],
      max_pos: [chromInfo.totalLength],
    };

    tilesetInfos[uid] = retVal;

    return retVal;
  });
};

const tile = async (uid, z, x) => {
  if (!uid || !dataOptions[uid] || !dataOptions[uid].maxTileWidth) return;
  const {maxTileWidth, maxSampleSize} = dataOptions[uid];

  const fiberMinLength = (Object.hasOwn(dataOptions[uid], fiberMinLength)) ? dataOptions[uid].fiberMinLength : 0;
  const fiberMaxLength = (Object.hasOwn(dataOptions[uid], fiberMaxLength)) ? dataOptions[uid].fiberMaxLength : 30000;
  const fiberStrands = (Object.hasOwn(dataOptions[uid], fiberStrands)) ? dataOptions[uid].fiberStrands : ['+', '-'];

  const { bamUrl, fastaUrl, chromSizesUrl } = dataConfs[uid];
  const bamFile = bamFiles[bamUrl];
  const sequenceFile = (fastaUrl) ? (sequenceFiles[fastaUrl]) ? sequenceFiles[fastaUrl] : null : null;

  return tilesetInfo(uid).then((tsInfo) => {
    const basicSegmentAttributesOnly = false;
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
      sequenceTileValues.set(`${uid}.${z}.${x}`, []);

      if (chromStart <= minX && minX < chromEnd) {
        // start of the visible region is within this chromosome
        const fetchOptions = {
          viewAsPairs: areMatesRequired(trackOptions[uid]),
          maxSampleSize: maxSampleSize || 1000,
          maxInsertSize: 1000,
          assemblyName: 'hg38',
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
                    basicSegmentAttributesOnly,
                  ),
                );

                tileValues.set(
                  `${uid}.${z}.${x}`,
                  tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                );
                if (trackOptions[uid].methylation || trackOptions[uid].fire) {
                  const filteredByLengthRecords = mappedRecords.filter((rec) => Math.abs(rec.to - rec.from) >= fiberMinLength && Math.abs(rec.to - rec.from) <= fiberMaxLength);
                  const filteredByStrandsRecords = filteredByLengthRecords.filter((rec) => fiberStrands.includes(rec.strand));
                  const filteredRecords = filteredByStrandsRecords;
                  tileValues.set(
                    `${uid}.${z}.${x}`,
                    tileValues.get(`${uid}.${z}.${x}`).concat(filteredRecords),
                  );
                }
                else {
                  tileValues.set(
                    `${uid}.${z}.${x}`,
                    tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                  );
                }
              }),
          );

          // handle sequence data, if available
          if (sequenceFile) {
            // console.log(`A1 | pushing sequenceFile lookup into sequenceTileValues | ${chromName}:${minX - chromStart}-${chromEnd - chromStart}`);
            recordPromises.push(
              sequenceFile
                .getSequence(
                  chromName,
                  minX - chromStart,
                  chromEnd - chromStart,
                )
                .then((sequence) => {
                  // console.log(`A1 | sequence | ${uid}.${z}.${x} | ${minX - chromStart} | ${chromEnd - chromStart} | ${sequence}`);
                  const sequenceRecord = {
                    id: `${chromName}:${minX - chromStart}-${chromEnd - chromStart}`,
                    chrom: chromName,
                    start: minX - chromStart,
                    stop: chromEnd - chromStart,
                    chromOffset: cumPositions[i].pos,
                    data: sequence,
                  };
                  sequenceTileValues.set(
                    `${uid}.${z}.${x}`,
                    sequenceTileValues.get(`${uid}.${z}.${x}`).concat(sequenceRecord),
                  );
                }),
            );
          }

          // continue onto the next chromosome
          minX = chromEnd;
        }
        else {
          const endPos = Math.ceil(maxX - chromStart);
          const startPos = Math.floor(minX - chromStart);
          // console.log(`fetching ${chromName}:${startPos}-${endPos} | ${JSON.stringify(fetchOptions)}`);
          // the end of the region is within this chromosome
          recordPromises.push(
            bamFile
              .getRecordsForRange(
                chromName,
                startPos,
                endPos,
                fetchOptions,
              )
              .then((records) => {
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(
                    rec,
                    chromName,
                    cumPositions[i].pos,
                    trackOptions[uid],
                    basicSegmentAttributesOnly,
                  ),
                );

                tileValues.set(
                  `${uid}.${z}.${x}`,
                  tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                );
                if (trackOptions[uid].methylation) {
                  const filteredByLengthRecords = mappedRecords.filter((rec) => Math.abs(rec.to - rec.from) >= fiberMinLength && Math.abs(rec.to - rec.from) <= fiberMaxLength);
                  const filteredByStrandsRecords = filteredByLengthRecords.filter((rec) => fiberStrands.includes(rec.strand));
                  const filteredRecords = filteredByStrandsRecords;
                  tileValues.set(
                    `${uid}.${z}.${x}`,
                    tileValues.get(`${uid}.${z}.${x}`).concat(filteredRecords),
                  );
                }
                else if (trackOptions[uid].fire) {
                  const filteredByLengthRecords = mappedRecords.filter((rec) => Math.abs(rec.to - rec.from) >= fiberMinLength && Math.abs(rec.to - rec.from) <= fiberMaxLength);
                  const filteredByStrandsRecords = filteredByLengthRecords.filter((rec) => fiberStrands.includes(rec.strand));
                  const filteredRecords = filteredByStrandsRecords;
                  tileValues.set(
                    `${uid}.${z}.${x}`,
                    tileValues.get(`${uid}.${z}.${x}`).concat(filteredRecords),
                  );
                }
                else {
                  tileValues.set(
                    `${uid}.${z}.${x}`,
                    tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                  );
                }
                return [];
              }),
          );

          if (sequenceFile) {
            // handle sequence data, if available
            recordPromises.push(
              sequenceFile
                .getSequence(
                  chromName,
                  startPos,
                  endPos,
                )
                .then((sequence) => {
                  const sequenceRecord = {
                    id: `${chromName}:${startPos}-${endPos}`,
                    chrom: chromName,
                    start: startPos,
                    stop: endPos,
                    chromOffset: cumPositions[i].pos,
                    data: sequence,
                  };
                  sequenceTileValues.set(
                    `${uid}.${z}.${x}`,
                    sequenceTileValues.get(`${uid}.${z}.${x}`).concat(sequenceRecord),
                  );

                  return [];
                }),
            );
          }

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
              rowJsonTile = tabularJsonToRowJson(rt[fullTileId]);
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

    for (let value of values) {
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
    const z = parseInt(parts[0], 10);
    const x = parseInt(parts[1], 10);

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
      try {
        tiles[validTileId].tilePositionId = validTileId;
      } catch (e) {}
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
  let segmentFromWithPadding = section.fromWithClipping - padding;
  let segmentToWithPadding = section.toWithClipping + padding;

  // no row has been assigned - find a suitable row and update the occupied space
  if (section.row === null || section.row === undefined) {
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

function segmentsToRows(segments, optionsIn, trackOptions) {
  const {
    prevRows,
    padding,
    readNamesToFilterOn,
  } = Object.assign(
    {
      prevRows: [],
      padding: 5,
      readNamesToFilterOn: [],
    },
    optionsIn || {},
  );
  const viewAsPairs = trackOptions.viewAsPairs;

  // console.log(`optionsIn ${JSON.stringify(optionsIn)}`);

  // if (readNamesToFilterOn && readNamesToFilterOn.identifiers && readNamesToFilterOn.identifiers.length > 0) {
  //   // console.log(`pre segments ${Object.keys(segments).length} | readNamesToFilterOn ${readNamesToFilterOn.identifiers.length}`);
  //   segments = segments.filter((segment) => readNamesToFilterOn.identifiers.includes(segment.readName));
  //   // console.log(`post segments ${Object.keys(segments).length} | readNamesToFilterOn ${readNamesToFilterOn.identifiers.length}`);
  // }

  // The following array contains elements fo the form
  // occupiedSpaceInRows[i] = {from: 100, to: 110}
  // This means that in row i, the space from 100 to 110 is occupied and reads cannot be placed there
  // This array is updated with every section that is added to the scene
  let occupiedSpaceInRows = [];
  const sectionIds = new Set(sections.map((x) => x.id));

  // We only need those previous sections, that are in the current sections list
  // We will assume that prevRows is already sorted by base so we won't modify it
  const prevSections = prevRows
    .flat()
    .filter((section) => sectionIds.has(section.id));

  const maxRows = (optionsIn.maxRows) ? optionsIn.maxRows : null;
  
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

  let sortedSections = [];
  if (trackOptions.sortByBase) {
    // We need to assign the sections to the rows that intersect the
    // sorted base first.
    sortedSections = groupSectionsBySortedBase(
      filteredSections,
      trackOptions.sortByBase,
    );

    for (let section of sortedSections) {
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

  const outputRows = [];
  for (let i = 0; i < occupiedSpaceInRows.length; i++) {
    outputRows[i] = newSections
      .filter((x) => x.row === i)
      .concat(sortedSections.filter((x) => x.row === i));
  }
  else {
    for (let i = 0; i < occupiedSpaceInRows.length; i++) {
      outputRows[i] = newSegments.filter((x) => x.row === i);
    }
  }

  // console.log(`outputRows ${JSON.stringify(outputRows.length)} | segmentsInRows ${JSON.stringify(segments.length)}`);

  return outputRows;
}

const STARTING_POSITIONS_ARRAY_LENGTH = 2 ** 20;
const STARTING_COLORS_ARRAY_LENGTH = 2 ** 21;
const STARTING_INDEXES_LENGTH = 2 ** 21;

let allPositionsLength = STARTING_POSITIONS_ARRAY_LENGTH;
let allColorsLength = STARTING_COLORS_ARRAY_LENGTH;
let allIndexesLength = STARTING_INDEXES_LENGTH;

let allPositions = new Float32Array(allPositionsLength);
let allColors = new Float32Array(allColorsLength);
let allIndexes = new Int32Array(allIndexesLength);

function isEmpty(obj) {
  for (var i in obj) { return false; }
  return true;
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
    // strand: segments[0].strand,
  };
};

const exportSignalMatrices = (
  sessionId,
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  signalMatrixExportDataObj,
) => {
  const allSegments = {};

  for (const tileId of tileIds) {
    let tileValue = null;
    try {
      tileValue = tileValues.get(`${uid}.${tileId}`);
      // console.log(`uid ${JSON.stringify(uid)}`);
      // console.log(`tileId ${JSON.stringify(tileId)}`);

      if (tileValue.error) {
        // throw new Error(tileValue.error);
        continue;
      }
    }
    catch (err) {
      continue;
    }
    if (!tileValue) continue;

    for (const segment of tileValue) {
      allSegments[segment.id] = segment;
    }
  }

  const fiberMinLength = (Object.hasOwn(dataOptions[uid], fiberMinLength)) ? dataOptions[uid].fiberMinLength : 0;
  const fiberMaxLength = (Object.hasOwn(dataOptions[uid], fiberMaxLength)) ? dataOptions[uid].fiberMaxLength : 30000;
  const fiberStrands = (Object.hasOwn(dataOptions[uid], fiberStrands)) ? dataOptions[uid].fiberStrands : ['+', '-'];

  let segmentList = Object.values(allSegments);

  let signalMatrixResultsToExport = null;

  if (signalMatrixExportDataObj && trackOptions.methylation) {
    const signalMatrixExportDataObjToUse = signalMatrixExportDataObj;

    const chromStart = signalMatrixExportDataObjToUse.range.left.start;
    const chromEnd = signalMatrixExportDataObjToUse.range.right.stop;
    const viewportChromStart = signalMatrixExportDataObjToUse.viewportRange.left.start;
    const viewportChromEnd = signalMatrixExportDataObjToUse.viewportRange.right.stop;
    const method = signalMatrixExportDataObjToUse.method;
    const distanceFn = signalMatrixExportDataObjToUse.distanceFn;
    const eventCategories = signalMatrixExportDataObjToUse.eventCategories;
    const linkage = signalMatrixExportDataObjToUse.linkage;
    const epsilon = signalMatrixExportDataObjToUse.epsilon;
    const minimumPoints = signalMatrixExportDataObjToUse.minimumPoints;
    const probabilityThresholdRange = {min: signalMatrixExportDataObjToUse.probabilityThresholdRange[0], max: signalMatrixExportDataObjToUse.probabilityThresholdRange[1]};
    const eventOverlapType = signalMatrixExportDataObjToUse.eventOverlapType;
    const fiberMinLength = signalMatrixExportDataObjToUse.filterFiberMinLength;
    const fiberMaxLength = signalMatrixExportDataObjToUse.filterFiberMaxLength;
    const fiberStrands = signalMatrixExportDataObjToUse.filterFiberStrands;
    const integerBasesPerPixel = Math.floor(signalMatrixExportDataObjToUse.basesPerPixel);
    const viewportWidthInPixels = signalMatrixExportDataObjToUse.viewportWidthInPixels;

    let distanceFnToCall = null;
    // const eventVecLen = chromEnd - chromStart;
    // const viewportRawEventVecLen = (viewportChromEnd - viewportChromStart <= 5000) ? viewportChromEnd - viewportChromStart : null;
    const viewportRawEventVecLen = viewportChromEnd - viewportChromStart;
    const viewportReducedEventVecLen = (integerBasesPerPixel > 0) ? Math.floor(viewportRawEventVecLen / integerBasesPerPixel) : viewportRawEventVecLen;
    // console.log(`viewportRawEventVecLen ${JSON.stringify(viewportRawEventVecLen)}`);
    // console.log(`viewportReducedEventVecLen ${JSON.stringify(viewportReducedEventVecLen)}`);
    // console.log(`viewportWidthInPixels ${JSON.stringify(viewportWidthInPixels)}`);
    // console.log(`eventVecLen ${JSON.stringify(eventVecLen)}`);
    // console.log(`integerBasesPerPixel ${JSON.stringify(integerBasesPerPixel)}`);
    const nReads = segmentList.length;
    // console.log(`nReads ${JSON.stringify(nReads)}`);
    // const clusterMatrix = new Array();
    // const viewportRawEventMatrix = (viewportRawEventVecLen) ? new Array() : [];
    const viewportAggregatedEventMatrix = (viewportReducedEventVecLen) ? new Array() : [];
    const identifiersArray = new Array();
    let allowedRowIdx = 0;
    const trueRow = {};

    switch (method) {
      case 'AGNES':
        switch (distanceFn) {
          case 'Euclidean':
            distanceFnToCall = euclideanDistance;
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentStrand = segment.strand;
              const segmentLength = segment.to - segment.from;
              // const eventVec = new Array(eventVecLen).fill(-255);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              const mos = segment.methylationOffsets;

              if (segmentLength < fiberMinLength || segmentLength > fiberMaxLength) continue;
              if (fiberStrands && !fiberStrands.includes(segmentStrand)) continue;

              switch (eventOverlapType) {
                case 'Full viewport':
                  if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: full viewport overlap allows init to 0
                    // for loop provides faster initialization than Array.init
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = 0;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      const viewportOffsetEnd = viewportOffsetStart + viewportRawEventVecLen;
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx];
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= viewportOffsetStart) && (offset <= viewportOffsetEnd)) {
                              viewportRawEventVec[offset - viewportOffsetStart] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;

                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                      // viewportRawEventVec = [];
                      // console.log(`viewportRawEventVec ${JSON.stringify(viewportRawEventVec)}`);
                    }
                    allowedRowIdx++;
                  }
                  break;

                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          case 'Jaccard':
            distanceFnToCall = jaccardDistance;
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentStrand = segment.strand;
              const segmentLength = segment.to - segment.from;
              // const eventVec = new Array(eventVecLen).fill(0);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              const mos = segment.methylationOffsets;

              if (segmentLength < fiberMinLength || segmentLength > fiberMaxLength) continue;
              if (fiberStrands && !fiberStrands.includes(segmentStrand)) continue;

              switch (eventOverlapType) {
                case 'Full viewport':
                  if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: full viewport overlap allows init to 0
                    // for loop provides faster initialization than Array.init
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = 0;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      const viewportOffsetEnd = viewportOffsetStart + viewportRawEventVecLen;
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx];
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= viewportOffsetStart) && (offset <= viewportOffsetEnd)) {
                              viewportRawEventVec[offset - viewportOffsetStart] = 1;
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = 1;
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = 1;
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = 1;
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = 1;
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = 1;
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          default:
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for subregion cluster matrix construction`);
        }
        break;
      case 'DBSCAN':
        switch (distanceFn) {
          case 'Euclidean':
            distanceFnToCall = (a, b) => Math.hypot(...Object.keys(a).map(k => b[k] - a[k]));
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentStrand = segment.strand;
              const segmentLength = segment.to - segment.from;
              // const eventVec = new Array(eventVecLen).fill(-255);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              const mos = segment.methylationOffsets;

              if (segmentLength < fiberMinLength || segmentLength > fiberMaxLength) continue;
              if (fiberStrands && !fiberStrands.includes(segmentStrand)) continue;

              switch (eventOverlapType) {
                case 'Full viewport':
                  if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: full viewport overlap allows init to 0
                    // for loop provides faster initialization than Array.init
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = 0;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      const viewportOffsetEnd = viewportOffsetStart + viewportRawEventVecLen;
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx];
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= viewportOffsetStart) && (offset <= viewportOffsetEnd)) {
                              viewportRawEventVec[offset - viewportOffsetStart] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    identifiersArray.push(segment.readName);

                    // ** viewport event matrix **
                    // note: partial overlap requires init to -255
                    if (viewportRawEventVecLen) {
                      const viewportRawEventVec = new Array(viewportRawEventVecLen);
                      for (let i = 0; i < viewportRawEventVecLen; i++) {
                        viewportRawEventVec[i] = -255;
                      }
                      const viewportOffsetStart = viewportChromStart - segmentStart;
                      // initialization is revised to 0 where there is fiber coverage
                      if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = 0; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                        for (let i = viewportOffsetStart; i < viewportRawEventVecLen; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      else if ((segmentStart >= viewportChromStart) && (segmentEnd <= viewportChromEnd)) {
                        const viewportOffsetEnd = viewportRawEventVecLen - (viewportChromEnd - segmentEnd);
                        for (let i = viewportOffsetStart; i < viewportOffsetEnd; i++) {
                          viewportRawEventVec[i] = 0;
                        }
                      }
                      for (const mo of mos) {
                        const offsets = mo.offsets;
                        const probabilities = mo.probabilities;
                        if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                          || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                          || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                          || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                          for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                            const offset = offsets[offsetIdx] - viewportOffsetStart;
                            const probability = probabilities[offsetIdx];
                            // ** do not filter on probability, to start; maybe change this later **
                            if ((offset >= 0) && (offset < viewportRawEventVecLen)) {
                              viewportRawEventVec[offset] = parseInt(probability);
                            }
                          }
                        }
                      }
                      // viewportRawEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      if (integerBasesPerPixel > 1) {
                        viewportAggregatedEventMatrix[allowedRowIdx] = movingMaxima(
                          viewportRawEventVec,
                          viewportRawEventVec.length,
                          0,
                          integerBasesPerPixel - 1,
                          integerBasesPerPixel
                        );
                      }
                      else {
                        viewportAggregatedEventMatrix[allowedRowIdx] = viewportRawEventVec;
                      }
                    }
                    allowedRowIdx++;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          default:
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for subregion cluster matrix construction`);
        }
        break;
      default:
        throw new Error(`Cluster method [${method}] is unknown or unsupported for subregion cluster matrix construction`);
    }

    if (viewportAggregatedEventMatrix.length > 0) {
      signalMatrixResultsToExport = {
        reducedEventViewportSignal: viewportAggregatedEventMatrix,
        reducedEventPerVectorLength: viewportReducedEventVecLen,
        identifiers: identifiersArray,
      }
    }

    const objData = {
      uid: signalMatrixExportDataObj.uid,
      signalMatrices: signalMatrixResultsToExport,
    }

    return objData;
  }
}

const exportTFBSOverlaps = (
  sessionId,
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  tfbsOverlapsExportDataObj,
) => {
  const allSegments = {};

  const tfbsOverlaps = [];

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

  if (tfbsOverlapsExportDataObj && trackOptions.tfbs) {
    const rangeStart = tfbsOverlapsExportDataObj.range.left.start;
    const rangeEnd = tfbsOverlapsExportDataObj.range.right.stop;

    for (let i = 0; i < segmentList.length; i++) {
      const segment = segmentList[i];
      const segmentStart = segment.from - segment.chrOffset;
      const segmentEnd = segment.to - segment.chrOffset;
      if (
        ((segmentStart <= rangeStart) && (segmentStart < rangeEnd) && (segmentEnd > rangeStart))
        ||
        ((segmentStart >= rangeStart) && (segmentStart < rangeEnd) && (segmentEnd >= rangeEnd))
        ||
        ((segmentStart >= rangeStart) && (segmentStart < rangeEnd) && (segmentEnd >= rangeStart) && (segmentEnd < rangeEnd))
        )
      {
        tfbsOverlaps.push(segment.readName);
      }
    }
  }

  const objData = {
    uid: tfbsOverlapsExportDataObj.uid,
    tfbsOverlaps: tfbsOverlaps,
  }
  return objData;
}

const exportIndexDHSOverlaps = (
  sessionId,
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  indexDHSOverlapsExportDataObj,
) => {
  const allSegments = {};

  const indexDHSOverlaps = [];

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

  if (indexDHSOverlapsExportDataObj && trackOptions.indexDHS) {
    const rangeStart = indexDHSOverlapsExportDataObj.range.left.start;
    const rangeEnd = indexDHSOverlapsExportDataObj.range.right.stop;

    for (let i = 0; i < segmentList.length; i++) {
      const segment = segmentList[i];
      const segmentStart = segment.from - segment.chrOffset;
      const segmentEnd = segment.to - segment.chrOffset;
      if (
        ((segmentStart <= rangeStart) && (segmentStart < rangeEnd) && (segmentEnd > rangeStart))
        ||
        ((segmentStart >= rangeStart) && (segmentStart < rangeEnd) && (segmentEnd >= rangeEnd))
        ||
        ((segmentStart >= rangeStart) && (segmentStart < rangeEnd) && (segmentEnd >= rangeStart) && (segmentEnd < rangeEnd))
        )
      {
        const overlappingDHSMetadata = {
          group: trackOptions.indexDHS.group,
          id: segment.metadata.dhs.id,
          name: trackOptions.indexDHS.itemRGBMap[segment.metadata.rgb],
          rgb: segment.metadata.rgb,
        };
        indexDHSOverlaps.push(overlappingDHSMetadata);
      }
    }
  }

  const objData = {
    uid: indexDHSOverlapsExportDataObj.uid,
    indexDHSOverlaps: indexDHSOverlaps,
  }
  return objData;
}

const exportUidTrackElements = (
  sessionId,
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  uidTrackElementMidpointExportDataObj,
) => {
  const recordPromises = [];

  if (uidTrackElementMidpointExportDataObj && trackOptions.genericBed) {
    const { bamUrl } = dataConfs[uid];
    const bamFile = bamFiles[bamUrl];
    const rangeChrom = uidTrackElementMidpointExportDataObj.range.left.chrom;
    const rangeStart = uidTrackElementMidpointExportDataObj.range.left.start;
    const rangeEnd = uidTrackElementMidpointExportDataObj.range.right.stop;
    const rangeMidpoint = Math.floor((rangeStart + rangeEnd) / 2);
    // console.log(`rangeChrom ${rangeChrom} | rangeStart ${rangeStart} | rangeEnd ${rangeEnd} | rangeMidpoint ${rangeMidpoint}`);
    const fetchOptions = {
      viewAsPairs: false,
      maxSampleSize: 1000,
      maxInsertSize: 1000,
      assemblyName: 'hg38',
    };
    const basicSegmentAttributesOnly = true;
    recordPromises.push(
      bamFile.getRecordsForRange(
        rangeChrom,
        rangeStart,
        rangeEnd,
        fetchOptions,
      ).then((records) => {
        const overlaps = [];
        const segmentList = records.map((rec) =>
          bamRecordToJson(rec, rangeChrom, rangeStart, trackOptions, basicSegmentAttributesOnly),
        );
        // console.log(`segmentList.length ${JSON.stringify(segmentList.length)}`);
        for (let i = 0; i < segmentList.length; i++) {
          const segment = segmentList[i];
          const segmentStart = segment.from - segment.chrOffset;
          const segmentEnd = segment.to - segment.chrOffset;
          const segmentMidpoint = Math.floor((segmentStart + segmentEnd) / 2);
          // if (i === 0) { console.log(`segmentStart ${segmentStart} | segmentEnd ${segmentEnd} | segmentMidpoint ${segmentMidpoint} || rangeStart ${rangeStart} | rangeEnd ${rangeEnd} | rangeMidpoint ${rangeMidpoint}`); }
          const overlap = {
            absDistanceFromMidpoint: Math.abs(rangeMidpoint - segmentMidpoint),
            signedDistanceFromMidpoint: (rangeMidpoint > segmentMidpoint) ? -Math.abs(rangeMidpoint - segmentMidpoint) : Math.abs(rangeMidpoint - segmentMidpoint),
            // viewportRange: uidTrackElementMidpointExportDataObj.range,
            segment: {
              chrName: segment.chrName,
              start: segmentStart,
              end: segmentEnd,
            },
          };
          // console.log(`uidTrackElementMidpointExportDataObj.offset ${uidTrackElementMidpointExportDataObj.offset} | overlap.signedDistanceFromMidpoint ${overlap.signedDistanceFromMidpoint}`);
          if (
            (uidTrackElementMidpointExportDataObj.offset === 0)
            || 
            (uidTrackElementMidpointExportDataObj.offset === 1 && overlap.signedDistanceFromMidpoint > 0) 
            || 
            (uidTrackElementMidpointExportDataObj.offset === -1 && overlap.signedDistanceFromMidpoint < 0)
            ) 
          {
            // console.log(`pushing overlap ${JSON.stringify(overlap)}`);
            overlaps.push(overlap);
          }
          // overlaps.push(overlap);
          // if (i === 0) { console.log(`overlaps ${JSON.stringify(overlaps)}`); }
        }

        switch (uidTrackElementMidpointExportDataObj.offset) {
          case -1:
          case 0:
          case 1:
            overlaps.sort((a, b) => a.absDistanceFromMidpoint - b.absDistanceFromMidpoint);
            break;
          default:
            break;
        }
        // console.log(`returned overlaps ${JSON.stringify(overlaps)}`);
        return overlaps;
      })
    );
  }

  return Promise.all(recordPromises).then((values) => {
    return {
      uid: uidTrackElementMidpointExportDataObj.uid,
      overlaps: values.flat(),
      offset: uidTrackElementMidpointExportDataObj.offset,
    };
  });
}

const exportSegmentsAsBED12 = (
  sessionId,
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  bed12ExportDataObj,
) => {
  const allSegments = {};

  const bed12Elements = [];

  for (const tileId of tileIds) {
    const tileValue = tileValues.get(`${uid}.${tileId}`);

    if (tileValue.error) {
      throw new Error(tileValue.error);
    }

    for (const segment of tileValue) {
      allSegments[segment.id] = segment;
    }
  }

  // console.log(`allSegments ${JSON.stringify(allSegments)}`);

  let segmentList = Object.values(allSegments);

  if (trackOptions.minMappingQuality > 0) {
    segmentList = segmentList.filter((s) => s.mapq >= trackOptions.minMappingQuality)
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

  // console.log(`bed12ExportDataObj ${JSON.stringify(bed12ExportDataObj)}`);
  // console.log(`grouped ${JSON.stringify(grouped)}`);

  if (bed12ExportDataObj && trackOptions.methylation) {
    const chromName = bed12ExportDataObj.range.left.chrom;
    const chromStart = bed12ExportDataObj.range.left.start;
    const chromEnd = bed12ExportDataObj.range.right.stop;
    const method = bed12ExportDataObj.method;
    const distanceFn = bed12ExportDataObj.distanceFn;
    const eventCategories = bed12ExportDataObj.eventCategories;
    const linkage = bed12ExportDataObj.linkage;
    const epsilon = bed12ExportDataObj.epsilon;
    const minimumPoints = bed12ExportDataObj.minimumPoints;
    const probabilityThresholdRange = {min: bed12ExportDataObj.probabilityThresholdRange[0], max: bed12ExportDataObj.probabilityThresholdRange[1]};
    let distanceFnToCall = null;
    const eventVecLen = chromEnd - chromStart;
    const nReads = segmentList.length;
    const data = new Array();
    let allowedRowIdx = 0;
    const trueRow = {};

    switch (method) {
      case 'AGNES':
        switch (distanceFn) {
          case 'Euclidean':
            distanceFnToCall = euclideanDistance;
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentLength = segment.to - segment.from;
              const eventVec = new Array(eventVecLen).fill(-255);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              switch (eventOverlapType) {
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    const offsetModifier = segmentStart - chromStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offsetModifier + offset < eventVecLen) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offsetModifier + offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = segmentEnd - segmentStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    const offsetStart = segmentStart - chromStart;
                    const offsetEnd = chromEnd - segmentStart + offsetStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset < offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          case 'Jaccard':
            distanceFnToCall = jaccardDistance;
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentLength = segment.to - segment.from;
              const eventVec = new Array(eventVecLen).fill(0);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              switch (eventOverlapType) {
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    const offsetModifier = segmentStart - chromStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offsetModifier + offset < eventVecLen) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offsetModifier + offset] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = segmentEnd - segmentStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    const offsetStart = segmentStart - chromStart;
                    const offsetEnd = chromEnd - segmentStart + offsetStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset < offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          default:
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for BED12 export cluster matrix generation`);
            break;
        }
        break;
      case 'DBSCAN':
        switch (distanceFn) {
          case 'Euclidean':
            distanceFnToCall = (a, b) => Math.hypot(...Object.keys(a).map(k => b[k] - a[k]));
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentLength = segment.to - segment.from;
              const eventVec = new Array(eventVecLen).fill(-255);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              switch (eventOverlapType) {
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    const offsetModifier = segmentStart - chromStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offsetModifier + offset < eventVecLen) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offsetModifier + offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = segmentEnd - segmentStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    const offsetStart = segmentStart - chromStart;
                    const offsetEnd = chromEnd - segmentStart + offsetStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'C')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset < offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    data[allowedRowIdx++] = eventVec;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          default:
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for subregion cluster matrix construction`);
            break;
        }
        break;
      default:
        throw new Error(`Cluster method [${method}] is unknown or unsupported for BED12 export cluster matrix generation`);
        break;
    }

    if (data.length > 0) {
      switch (method) {
        case 'AGNES':
          const { clusters, distances, order, clustersGivenK } = clusterData({
            data: data,
            distance: distanceFnToCall,
            linkage: averageDistance,
            onProgress: null,
          });
          // console.log(`order ${order}`);
          const orderedSegments = order.map(i => {
            const trueRowIdx = trueRow[i];
            const segment = segmentList[trueRowIdx];
            return [segment];
          })
          for (let key of Object.keys(grouped)) {
            const rows = orderedSegments;
            grouped[key] = {};
            grouped[key].rows = rows;
          }
          break;
        case 'DBSCAN':
          function flatten(arr) {
            const out = [];
            const path = [];
            for (let i = 0; i < arr.length; i++) {
              const item = arr[i];
              if (Array.isArray(item)) {
                path.push(arr, i);
                i = -1;
                arr = item;
                continue;
              }
              out.push(item);
              while (i === arr.length - 1 && path.length)  i = path.pop(), arr = path.pop();
            }
            return out;
          }
          const results = dbscan({
            dataset: data,
            epsilon: epsilon,
            minimumPoints: minimumPoints,
            distanceFunction: distanceFnToCall,
          });
          // console.log(`result ${JSON.stringify(result)}`);
          if (results.clusters.length > 0) {
            const order = flatten(results.clusters.concat(results.noise));
            const orderedSegments = order.map(i => {
              const trueRowIdx = trueRow[i];
              const segment = segmentList[trueRowIdx];
              return [segment];
            });
            for (let key of Object.keys(grouped)) {
              const rows = orderedSegments;
              grouped[key] = {};
              grouped[key].rows = rows;
            }
          }
          else {
            for (let key of Object.keys(grouped)) {
              const rows = segmentsToRows(grouped[key], {
                prevRows: (prevRows[key] && prevRows[key].rows) || [],
              });
              grouped[key] = {};
              grouped[key].rows = rows;
            }
          }
          break;
        default:
          throw new Error(`Cluster method [${method}] is unknown or unsupported for BED12 export clustering`);
      }
    }
    else {
      for (let key of Object.keys(grouped)) {
        const rows = segmentsToRows(grouped[key], {
          prevRows: (prevRows[key] && prevRows[key].rows) || [],
        });
        grouped[key] = {};
        grouped[key].rows = rows;
      }
    }

    // data.length = 0;

    const totalRows = Object.values(grouped)
      .map((x) => x.rows.length)
      .reduce((a, b) => a + b, 0);

    for (const group of Object.values(grouped)) {
      const { rows } = group;

      rows.map((row, i) => {
        row.map((segment, j) => {
          const showM5CForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5mC+');
          const showM5CReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5mC-');
          const showHM5CForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5hmC+');
          const showHM5CReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5hmC-');
          const showM6AForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('m6A+');
          const showM6AReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('m6A-');
          const minProbabilityThreshold = (trackOptions && trackOptions.methylation && trackOptions.methylation.probabilityThresholdRange) ? trackOptions.methylation.probabilityThresholdRange[0] : 0;
          const maxProbabilityThreshold = (trackOptions && trackOptions.methylation && trackOptions.methylation.probabilityThresholdRange) ? trackOptions.methylation.probabilityThresholdRange[1] + 1: 255;
          let mmSegmentColor = null;
          //
          // UCSC BED format
          // https://genome.ucsc.edu/FAQ/FAQformat.html#format1
          //
          const newBed12Element = {
            'chrom': chromName,
            'chromStart': segment.start - 1, // zero-based index
            'chromEnd': segment.start + (segment.to - segment.from) - 1, // zero-based index
            'name': `${bed12ExportDataObj.name}__${segment.readName}`,
            'score': 1000,
            'strand': segment.strand,
            'thickStart': segment.start - 1, // zero-based index
            'thickEnd': segment.start + (segment.to - segment.from) - 1, // zero-based index
            'itemRgb': hexToRGBRawTriplet(bed12ExportDataObj.colors[0]),
            'blockCount': 0,
            'blockSizes': [],
            'blockStarts': [],
          };
          for (const mo of segment.methylationOffsets) {
            const offsets = mo.offsets;
            const probabilities = mo.probabilities;
            const offsetLength = 1;
            switch (mo.unmodifiedBase) {
              case 'C':
                if ((mo.code === 'm') && (mo.strand === '+') && showM5CForwardEvents) {
                  mmSegmentColor = null; // PILEUP_COLOR_IXS.MM_M5C_FOR;
                }
                else if ((mo.code === 'h') && (mo.strand === '+') && showHM5CForwardEvents) {
                  mmSegmentColor = null; // PILEUP_COLOR_IXS.MM_HM5C_FOR;
                }
                break;
              case 'G':
                if ((mo.code === 'm') && (mo.strand === '-') && showM5CReverseEvents) {
                  mmSegmentColor = null; // PILEUP_COLOR_IXS.MM_M5C_REV;
                }
                else if ((mo.code === 'h') && (mo.strand === '-') && showHM5CReverseEvents) {
                  mmSegmentColor = null; // PILEUP_COLOR_IXS.MM_HM5C_REV;
                }
                break;
              case 'A':
                if ((mo.code === 'a') && (mo.strand === '+') && showM6AForwardEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M6A_FOR;
                }
                break
              case 'T':
                if ((mo.code === 'a') && (mo.strand === '-') && showM6AReverseEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M6A_REV;
                }
                break;
              default:
                break;
            }
            if (mmSegmentColor) {
              let offsetIdx = 0;
              for (const offset of offsets) {
                const probability = probabilities[offsetIdx];
                if (probability >= minProbabilityThreshold && probability < maxProbabilityThreshold) {
                  newBed12Element.blockCount++;
                  newBed12Element.blockSizes.push(offsetLength);
                  newBed12Element.blockStarts.push(offset - 1); // zero-based index
                }
                offsetIdx++;
              }
              newBed12Element.blockStarts.sort((a, b) => a - b); // can do this because blockSizes are all the same size
            }
          };
          bed12Elements.push(newBed12Element);
        });
      });
    }
  }

  const objData = {
    // rows: grouped,
    uid: bed12ExportDataObj.uid,
    bed12Elements: bed12Elements,
  }
  return objData;
};

const movingMaxima = (array, nArray, countBefore, countAfter, step) => {
  if (countAfter === undefined) countAfter = 0;
  if (step === undefined) step = 1;
  const result = [];
  for (let i = 0; i < nArray; i += step) {
    const subArr = array.slice(Math.max(i - countBefore, 0), Math.min(i + countAfter + 1, nArray)).map((x) => isNaN(x) ? -255 : (x < 0) ? -255 : x);
    // const avg = subArr.reduce((a, b) => a + b, 0) / subArr.length;
    const maxima = Math.max(...subArr);
    result.push(maxima);
    // try {
    //   result.push(maxima);
    // } catch (err) {
    //   console.log(`subArr ${JSON.stringify(subArr)}`);
    //   console.log(`maxima ${JSON.stringify(maxima)}`);
    // }
  }
  return result;
}

const renderSegments = (
  sessionId,
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  alignCpGEvents,
  originatingTrackId,
  clusterDataObj,
  fireIdentifierDataObj,
) => {

  const allSegments = {};
  // const allSequences = {};
  const highlightPositions = {};
  let allReadCounts = {};
  let coverageSamplingDistance;
  let ATPositions = null;

  for (const tileId of tileIds) {
    let tileValue = null;
    try {
      tileValue = tileValues.get(`${uid}.${tileId}`);

      // if (trackOptions.fire) {
      //   console.log(`uid ${JSON.stringify(uid)}`);
      //   console.log(`tileId ${JSON.stringify(tileId)}`);
      // }

      if (tileValue.error) {
        // throw new Error(tileValue.error);
        continue;
      }
    }
    catch (err) {
      continue;
    }
    if (!tileValue) continue;

    if (trackOptions.methylation && alignCpGEvents) {
      for (const segment of tileValue) {
        // console.log(`segment ${JSON.stringify(segment)}`);
        for (const mo of segment.methylationOffsets) {
          if (mo.unmodifiedBase === 'C' && segment.strand === '-') {
            mo.offsets = mo.offsets.map(offset => offset - 1);
          }
        }
      }
    }

    for (const segment of tileValue) {
      allSegments[segment.id] = segment;
    }

    const sequenceTileValue = sequenceTileValues.get(`${uid}.${tileId}`);

    if (sequenceTileValue && trackOptions.methylation && trackOptions.methylation.highlights) {
      const highlights = Object.keys(trackOptions.methylation.highlights);
      for (const sequence of sequenceTileValue) {
        // allSequences[parseInt(sequence.start)] = sequence.data;
        const absPosStart = parseInt(sequence.start) + parseInt(sequence.chromOffset);
        const seq = sequence.data.toUpperCase();
        for (const highlight of highlights) {
          if (highlight !== 'M0A') {
            const highlightUC = highlight.toUpperCase();
            const highlightLength = highlight.length;
            let posn = seq.indexOf(highlightUC);
            if (isEmpty(highlightPositions) || !highlightPositions[highlight]) highlightPositions[highlight] = new Array();
            while (posn > -1) {
              highlightPositions[highlight].push(posn + absPosStart + 1); // 1-based indexed positions!
              posn = seq.indexOf(highlightUC, posn + highlightLength);
            }
          }
          else if (highlight === 'M0A') {
            let posnA = seq.indexOf('A');
            let posnT = seq.indexOf('T');
            let posn = Math.min(posnA, posnT);
            if (isEmpty(highlightPositions) || !highlightPositions[highlight]) highlightPositions[highlight] = new Array();
            while (posn > -1) {
              highlightPositions[highlight].push(posn + absPosStart + 1); // 1-based indexed positions!
              posnA = seq.indexOf('A', posn + 1);
              posnT = seq.indexOf('T', posn + 1);
              posn = ((posnA !== -1) && (posnT !== -1)) ? Math.min(posnA, posnT) : (posnA === -1) ? posnT : (posnT === -1) ? posnA : -1;
            }
            ATPositions = new Set([...highlightPositions[highlight]]);
          }
        }
      }
    }
  }

  let segmentList = Object.values(allSegments);
  const drawnSegmentIdentifiers = {
    [originatingTrackId]: {
      methylation: [],
      fire: [],
      indexDHS: [],
    },
  };

  const fiberMinLength = (Object.hasOwn(dataOptions[uid], fiberMinLength)) ? dataOptions[uid].fiberMinLength : 0;
  const fiberMaxLength = (Object.hasOwn(dataOptions[uid], fiberMaxLength)) ? dataOptions[uid].fiberMaxLength : 30000;
  const fiberStrands = (Object.hasOwn(dataOptions[uid], fiberStrands)) ? dataOptions[uid].fiberStrands : ['+', '-'];

  // if (trackOptions.minMappingQuality > 0){
  //   segmentList = segmentList.filter((s) => s.mapq >= trackOptions.minMappingQuality)
  // }

  // prepareHighlightedReads(segmentList, trackOptions);

  // if (areMatesRequired(trackOptions) && !clusterDataObj) {
  //   // At this point reads are colored correctly, but we only want to align those reads that
  //   // are within the visible tiles - not mates that are far away, as this can mess up the alignment
  //   let tileMinPos = Number.MAX_VALUE;
  //   let tileMaxPos = -Number.MAX_VALUE;
  //   const tsInfo = tilesetInfos[uid];
  //   for (const id of tileIds) {
  //     const z = id.split('.')[0];
  //     const x = id.split('.')[1];
  //     const startEnd = tilesetInfoToStartEnd(tsInfo, +z, +x);
  //     tileMinPos = Math.min(tileMinPos, startEnd[0]);
  //     tileMaxPos = Math.max(tileMaxPos, startEnd[1]);
  //   }
  //   // tileIds.forEach((id) => {
  //   //   const z = id.split('.')[0];
  //   //   const x = id.split('.')[1];
  //   //   const startEnd = tilesetInfoToStartEnd(tsInfo, +z, +x);
  //   //   tileMinPos = Math.min(tileMinPos, startEnd[0]);
  //   //   tileMaxPos = Math.max(tileMaxPos, startEnd[1]);
  //   // });

  //   segmentList = segmentList.filter(
  //     (segment) => segment.to >= tileMinPos && segment.from <= tileMaxPos,
  //   );
  // }

  let [minPos, maxPos] = [Number.MAX_VALUE, -Number.MAX_VALUE];

  for (let i = 0; i < segmentList.length; i++) {
    if (segmentList[i].from < minPos) {
      minPos = segmentList[i].from;
    }

    if (segmentList[i].to > maxPos) {
      maxPos = segmentList[i].to;
    }
  }
  let grouped = { null: segmentList };

  // group by some attribute or don't
  // if (groupBy) {
  //   let groupByOption = trackOptions && trackOptions.groupBy;
  //   groupByOption = groupByOption ? groupByOption : null;
  //   grouped = groupBy(segmentList, groupByOption);
  // } else {
  //   grouped = { null: segmentList };
  // }

  // if (trackOptions.methylation) {
  //   // console.log(`grouped | A1 | ${JSON.stringify(segmentList)}`);
  //   // console.log(`grouped | A2 | ${JSON.stringify(grouped)}`);
  // }

  let clusterResultsToExport = null;

  // calculate the the rows of reads for each group
  if (clusterDataObj && trackOptions.methylation) {
    // const chromName = clusterDataObj.range.left.chrom;

    const clusterDataObjToUse = clusterDataObj;

    const chromStart = clusterDataObjToUse.range.left.start;
    const chromEnd = clusterDataObjToUse.range.right.stop;
    const viewportChromStart = clusterDataObjToUse.viewportRange.left.start;
    const viewportChromEnd = clusterDataObjToUse.viewportRange.right.stop;
    const method = clusterDataObjToUse.method;
    const distanceFn = clusterDataObjToUse.distanceFn;
    const eventCategories = clusterDataObjToUse.eventCategories;
    const linkage = clusterDataObjToUse.linkage;
    const epsilon = clusterDataObjToUse.epsilon;
    const minimumPoints = clusterDataObjToUse.minimumPoints;
    const probabilityThresholdRange = {min: clusterDataObjToUse.probabilityThresholdRange[0], max: clusterDataObjToUse.probabilityThresholdRange[1]};
    const eventOverlapType = clusterDataObjToUse.eventOverlapType;
    const fiberMinLength = clusterDataObjToUse.filterFiberMinLength;
    const fiberMaxLength = clusterDataObjToUse.filterFiberMaxLength;
    const fiberStrands = clusterDataObjToUse.filterFiberStrands;
    const integerBasesPerPixel = Math.floor(clusterDataObjToUse.basesPerPixel);
    const viewportWidthInPixels = clusterDataObjToUse.viewportWidthInPixels;

    let distanceFnToCall = null;
    const eventVecLen = chromEnd - chromStart;
    const viewportRawEventVecLen = viewportChromEnd - viewportChromStart;
    const nReads = segmentList.length;
    const clusterMatrix = new Array();
    const identifiersArray = new Array();
    let allowedRowIdx = 0;
    const trueRow = {};

    switch (method) {
      case 'AGNES':
        switch (distanceFn) {
          case 'Euclidean':
            distanceFnToCall = euclideanDistance;
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentStrand = segment.strand;
              const segmentLength = segment.to - segment.from;
              const eventVec = new Array(eventVecLen).fill(-255);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              const mos = segment.methylationOffsets;

              if (segmentLength < fiberMinLength || segmentLength > fiberMaxLength) continue;
              if (fiberStrands && !fiberStrands.includes(segmentStrand)) continue;

              // console.log(`segmentStart ${JSON.stringify(segmentStart)} | segmentEnd ${JSON.stringify(segmentEnd)} | segment.name ${JSON.stringify(segment.readName)}`);
              switch (eventOverlapType) {
                case 'Full viewport':
                  if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;

                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;

                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    const offsetModifier = segmentStart - chromStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offsetModifier + offset < eventVecLen) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offsetModifier + offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = segmentEnd - segmentStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    const offsetStart = segmentStart - chromStart;
                    const offsetEnd = chromEnd - segmentStart + offsetStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset < offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          case 'Jaccard':
            distanceFnToCall = jaccardDistance;
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentStrand = segment.strand;
              const segmentLength = segment.to - segment.from;
              const eventVec = new Array(eventVecLen).fill(0);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              const mos = segment.methylationOffsets;

              if (segmentLength < fiberMinLength || segmentLength > fiberMaxLength) continue;
              if (fiberStrands && !fiberStrands.includes(segmentStrand)) continue;

              switch (eventOverlapType) {
                case 'Full viewport':
                  if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    const offsetModifier = segmentStart - chromStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offsetModifier + offset < eventVecLen) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offsetModifier + offset] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = segmentEnd - segmentStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    const offsetStart = segmentStart - chromStart;
                    const offsetEnd = chromEnd - segmentStart + offsetStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset < offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset] = 1;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          default:
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for subregion cluster matrix construction`);
        }
        break;
      case 'DBSCAN':
        switch (distanceFn) {
          case 'Euclidean':
            distanceFnToCall = (a, b) => Math.hypot(...Object.keys(a).map(k => b[k] - a[k]));
            for (let i = 0; i < nReads; ++i) {
              const segment = segmentList[i];
              const segmentStrand = segment.strand;
              const segmentLength = segment.to - segment.from;
              const eventVec = new Array(eventVecLen).fill(-255);
              const segmentStart = segment.from - segment.chrOffset;
              const segmentEnd = segment.to - segment.chrOffset;
              const mos = segment.methylationOffsets;

              if (segmentLength < fiberMinLength || segmentLength > fiberMaxLength) continue;
              if (fiberStrands && !fiberStrands.includes(segmentStrand)) continue;

              switch (eventOverlapType) {
                case 'Full viewport':
                  if ((segmentStart < viewportChromStart) && (segmentEnd > viewportChromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                case 'Full subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                case 'Partial subregion':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = probabilities[offsetIdx];
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = parseInt(probability);
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentEnd <= chromEnd)) {
                    const offsetModifier = segmentStart - chromStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offsetModifier + offset < eventVecLen) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offsetModifier + offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart < chromStart) && (segmentEnd <= chromEnd) && (segmentEnd > chromStart)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = segmentEnd - segmentStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset <= offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset - offsetStart] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  else if ((segmentStart >= chromStart) && (segmentStart < chromEnd) && (segmentEnd > chromEnd)) {
                    const offsetStart = segmentStart - chromStart;
                    const offsetEnd = chromEnd - segmentStart + offsetStart;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A')
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC+') && mo.unmodifiedBase === 'C' && mo.code === 'm')
                        || (eventCategories.includes('5mC-') && mo.unmodifiedBase === 'G' && mo.code === 'm')
                        || (eventCategories.includes('5hmC+') && mo.unmodifiedBase === 'C' && mo.code === 'h')
                        || (eventCategories.includes('5hmC-') && mo.unmodifiedBase === 'G' && mo.code === 'h')) {
                        for (let offsetIdx = 0; offsetIdx < offsets.length; offsetIdx++) {
                          const offset = offsets[offsetIdx];
                          const probability = parseInt(probabilities[offsetIdx]);
                          if ((offset >= offsetStart) && (offset < offsetEnd) && (probabilityThresholdRange.min <= probability && probabilityThresholdRange.max >= probability)) {
                            eventVec[offset] = probability;
                          }
                        }
                      }
                    }
                    trueRow[allowedRowIdx] = i;
                    clusterMatrix[allowedRowIdx] = eventVec;
                    identifiersArray.push(segment.readName);
                    allowedRowIdx++;
                  }
                  break;
                default:
                  throw new Error(`Event overlap type [${eventOverlapType}] is unknown or unsupported for cluster matrix generation`);
              }
            }
            break;
          default:
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for subregion cluster matrix construction`);
        }
        break;
      default:
        throw new Error(`Cluster method [${method}] is unknown or unsupported for subregion cluster matrix construction`);
    }

    if (clusterMatrix.length > 0) {

      const signalMatrixExportDataObj = clusterDataObj;
      const exportSignalMatricesObj = exportSignalMatrices(
        sessionId,
        uid,
        tileIds,
        domain,
        scaleRange,
        position,
        dimensions,
        prevRows,
        trackOptions,
        signalMatrixExportDataObj,
      );
      const viewportAggregatedEventMatrix = exportSignalMatricesObj.signalMatrices.reducedEventViewportSignal;

      switch (method) {
        case 'AGNES':
          const { clusters, distances, order, clustersGivenK } = clusterData({
            data: clusterMatrix,
            distance: distanceFnToCall,
            linkage: averageDistance,
          });
          const newickString = convertAgnesClusterResultsToNewickString(clusters);
          const phylotreeTree = new phylotree(newickString);
          const phylotreeTreeOrder = fibertreeViewPhylotreeBranchDataToOrderedList(phylotreeTree.nodes.data).reverse();
          const rowOrdering = phylotreeTreeOrder;
          clusterResultsToExport = {
            clusters: clusters,
            order: rowOrdering,
            reducedEventViewportSignal: viewportAggregatedEventMatrix,
            newickString: newickString,
            identifiers: rowOrdering.map((i) => identifiersArray[i]),
          };
          const orderedSegments = rowOrdering.map(i => {
            const trueRowIdx = trueRow[i];
            const segment = segmentList[trueRowIdx];
            return [segment];
          });
          for (let key of Object.keys(grouped)) {
            const rows = orderedSegments;
            grouped[key] = {};
            grouped[key].rows = rows;
          }
          break;
        case 'DBSCAN':
          function flatten(arr) {
            const out = [];
            const path = [];
            for (let i = 0; i < arr.length; i++) {
              const item = arr[i];
              if (Array.isArray(item)) {
                path.push(arr, i);
                i = -1;
                arr = item;
                continue;
              }
              out.push(item);
              while (i === arr.length - 1 && path.length)  i = path.pop(), arr = path.pop();
            }
            return out;
          }
          const results = dbscan({
            dataset: clusterMatrix,
            epsilon: epsilon,
            minimumPoints: minimumPoints,
            distanceFunction: distanceFnToCall,
          });
          if (results.clusters.length > 0) {
            const order = flatten(results.clusters.concat(results.noise));
            const rowOrdering = order;
            clusterResultsToExport = {
              clusters: results,
              order: rowOrdering,
              reducedEventViewportSignal: viewportAggregatedEventMatrix,
              newickString: null,
              identifiers: rowOrdering.map((i) => identifiersArray[i]),
            };
            const orderedSegments = rowOrdering.map(i => {
              const trueRowIdx = trueRow[i];
              const segment = segmentList[trueRowIdx];
              return [segment];
            });
            for (let key of Object.keys(grouped)) {
              const rows = orderedSegments;
              grouped[key] = {};
              grouped[key].rows = rows;
            }
          }
          else {
            for (let key of Object.keys(grouped)) {
              const rows = segmentsToRows(grouped[key], {
                prevRows: (prevRows[key] && prevRows[key].rows) || [],
              });
              grouped[key] = {};
              grouped[key].rows = rows;
            }
          }
          break;
        default:
          throw new Error(`Cluster method [${method}] is unknown or unsupported for subregion clustering`);
      }
    }
    else {
      for (let key of Object.keys(grouped)) {
        const rows = segmentsToRows(grouped[key], {
          prevRows: (prevRows[key] && prevRows[key].rows) || [],
        });
        grouped[key] = {};
        grouped[key].rows = rows;
      }
    }

    // data.length = 0;
  }
  else if (fireIdentifierDataObj && (trackOptions.fire || trackOptions.ftFire)) {
    for (let key of Object.keys(grouped)) {
      const rows = segmentsToRows(grouped[key], {
        prevRows: (prevRows[key] && prevRows[key].rows) || [],
        readNamesToFilterOn: fireIdentifierDataObj.identifiers || [],
      });
      // At this point grouped[key] also contains all the segments (as array), but we only need grouped[key].rows
      // Therefore we get rid of everything else to save memory and increase performance
      grouped[key] = {};
      grouped[key].rows = rows;
    }
  }
  else {
    for (let key of Object.keys(grouped)) {
      const rows = segmentsToRows(grouped[key], {
        prevRows: (prevRows[key] && prevRows[key].rows) || [],
      });
      // At this point grouped[key] also contains all the segments (as array), but we only need grouped[key].rows
      // Therefore we get rid of everything else to save memory and increase performance
      grouped[key] = {};
      grouped[key].rows = rows;
    }
  }

  // calculate the height of each group
  const totalRows = Object.values(grouped)
    .map((x) => x.rows.length)
    .reduce((a, b) => a + b, 0);
  let currStart = trackOptions.showCoverage ? trackOptions.coverageHeight : 0;

  // const d = range(0, rows.length);
  const yGlobalScale = scaleBand()
    .domain(range(0, totalRows + currStart))
    .range([0, dimensions[1]])
    .paddingInner(0.2);

  let currPosition = 0;
  let currColor = 0;
  let currIdx = 0;

  const addPosition = (x1, y1) => {
    if (currPosition > allPositionsLength - 2) {
      allPositionsLength *= 2;
      const prevAllPositions = allPositions;

      allPositions = new Float32Array(allPositionsLength);
      allPositions.set(prevAllPositions);
    }
    allPositions[currPosition++] = x1;
    allPositions[currPosition++] = y1;

    return currPosition / 2 - 1;
  };

  const addColor = (colorIdx, n) => {
    if (currColor >= allColorsLength - n) {
      allColorsLength *= 2;
      const prevAllColors = allColors;

      allColors = new Float32Array(allColorsLength);
      allColors.set(prevAllColors);
    }

    for (let k = 0; k < n; k++) {
      allColors[currColor++] = colorIdx;
    }
  };

  const addTriangleIxs = (ix1, ix2, ix3) => {
    if (currIdx >= allIndexesLength - 3) {
      allIndexesLength *= 2;
      const prevAllIndexes = allIndexes;

      allIndexes = new Int32Array(allIndexesLength);
      allIndexes.set(prevAllIndexes);
    }

    allIndexes[currIdx++] = ix1;
    allIndexes[currIdx++] = ix2;
    allIndexes[currIdx++] = ix3;
  };

  const addRect = (x, y, width, height, colorIdx) => {
    const xLeft = x;
    const xRight = xLeft + width;
    const yTop = y;
    const yBottom = y + height;

    const ulIx = addPosition(xLeft, yTop);
    const urIx = addPosition(xRight, yTop);
    const llIx = addPosition(xLeft, yBottom);
    const lrIx = addPosition(xRight, yBottom);
    addColor(colorIdx, 4);

    addTriangleIxs(ulIx, urIx, llIx);
    addTriangleIxs(llIx, lrIx, urIx);
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

    // if (groupCounter % 2) {
      // addRect(
      //   0,
      //   grouped[key].start,
      //   xScale(maxPos) - xScale(minPos),
      //   grouped[key].end - grouped[key].start,
      //   PILEUP_COLOR_IXS.BLACK_05
      // );
    // }

    groupCounter += 1;
  }
  // background
  addRect(0, 0, dimensions[0], dimensions[1], PILEUP_COLOR_IXS.WHITE);

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

    const d = range(0, trackOptions.coverageHeight);
    const groupStart = yGlobalScale(0);
    const groupEnd =
      yGlobalScale(trackOptions.coverageHeight - 1) + yGlobalScale.bandwidth();
    const r = [groupStart, groupEnd];

    const yScale = scaleBand().domain(d).range(r).paddingInner(0.05);

    let xLeft, yTop, barHeight;
    let bgColor = PILEUP_COLOR_IXS.BG_MUTED;
    const width = (xScale(1) - xScale(0)) * coverageSamplingDistance;
    const groupHeight = yScale.bandwidth() * trackOptions.coverageHeight;
    const scalingFactor = groupHeight / maxReadCount;

    for (const pos of Object.keys(allReadCounts)) {
      xLeft = xScale(pos);
      yTop = groupHeight;

      // Draw rects for variants counts on top of each other
      for (const variant of Object.keys(allReadCounts[pos]['variants'])) {
        barHeight = allReadCounts[pos]['variants'][variant] * scalingFactor;
        yTop -= barHeight;
        // When the coverage is not exact, we don't color variants.
        let variantColor =
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

  for (const group of Object.values(grouped)) {
    const { rows } = group;

    const d = range(0, rows.length);
    const r = [group.start, group.end];

    // const yScale = scaleBand().domain(d).range(r).paddingInner(0.2);
    const fiberPadding = (trackOptions && trackOptions.indexDHS) ? 0.25 : (trackOptions && trackOptions.methylation && trackOptions.methylation.hasOwnProperty('fiberPadding')) ? trackOptions.methylation.fiberPadding : 0.0;
    const yScale = scaleBand().domain(d).range(r).paddingInner(fiberPadding);

    let xLeft;
    let xRight;
    let yTop;
    let yBottom;

    // let pileupSegmentsDrawn = 0;

    rows.map((row, i) => {
      // const height = (trackOptions && trackOptions.fire) ? yScale.bandwidth() / 3 : yScale.bandwidth();
      // yTop = yScale(i) + (trackOptions && trackOptions.fire ? height : 0);
      const height = yScale.bandwidth();
      yTop = yScale(i);
      yBottom = yTop + height;

      row.map((segment, j) => {
        if (!segment.from || !segment.to) return;

        const from = xScale(segment.from);
        const to = xScale(segment.to);

          xLeft = from;
          xRight = to;

        if (trackOptions && trackOptions.methylation) {
          addRect(xLeft, yTop, xRight - xLeft, height, segment.colorOverride || segment.color);
        }
        else if (trackOptions && trackOptions.indexDHS) {
          addRect(xLeft, yTop, xRight - xLeft, height, PILEUP_COLOR_IXS.INDEX_DHS_BG);
        }
        else if (trackOptions && trackOptions.tfbs) {
          addRect(xLeft, yTop + (height * 0.125), xRight - xLeft, height * 0.75, PILEUP_COLOR_IXS.TFBS_SEGMENT_BG);
        }
        else if (trackOptions && trackOptions.genericBed) {
          addRect(xLeft, yTop + (height * 0.125), xRight - xLeft, height * 0.75, PILEUP_COLOR_IXS.GENERIC_BED_SEGMENT_BG);
        }
        // else if (trackOptions && trackOptions.fire) {
        //   addRect(xLeft, yTop, xRight - xLeft, height, PILEUP_COLOR_IXS.FIRE_SEGMENT_BG);
        // }

        if (trackOptions && trackOptions.methylation && trackOptions.methylation.hideSubstitutions) {
          //
          // render non-m0A sequence highlights
          //
          if (!isEmpty(highlightPositions)) {
            const highlights = Object.keys(highlightPositions);
            for (const highlight of highlights) {
              const highlightLen = highlight.length;
              const highlightWidth = Math.max(1, xScale(highlightLen) - xScale(0));
              const highlightColor = PILEUP_COLOR_IXS[`HIGHLIGHTS_${highlight}`];
              const highlightPosns = highlightPositions[highlight];
              if (highlight !== 'M0A') {
                for (const posn of highlightPosns) {
                  if (posn >= segment.from && posn < segment.to) {
                    xLeft = xScale(posn);
                    xRight = xLeft + highlightWidth;
                    addRect(xLeft, yTop, highlightWidth, height, highlightColor);
                  }
                }
              }
            }
          }

          //
          // render methylation events
          //
          const showM5CForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5mC+');
          const showM5CReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5mC-');
          const showHM5CForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5hmC+');
          const showHM5CReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5hmC-');
          const showM6AForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('m6A+');
          const showM6AReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('m6A-');

          const minProbabilityThreshold = (trackOptions && trackOptions.methylation && trackOptions.methylation.probabilityThresholdRange) ? trackOptions.methylation.probabilityThresholdRange[0] : 0;
          const maxProbabilityThreshold = (trackOptions && trackOptions.methylation && trackOptions.methylation.probabilityThresholdRange) ? trackOptions.methylation.probabilityThresholdRange[1] + 1 : 256;

          // console.log(`rendering events with ML ranges [${minProbabilityThreshold}, ${maxProbabilityThreshold})`);

          let mmSegmentColor = null;
          // console.log(`segment.methylationOffsets ${JSON.stringify(segment.methylationOffsets)}`);
          for (const mo of segment.methylationOffsets) {
            const offsets = mo.offsets;
            const probabilities = mo.probabilities;
            const offsetLength = 1;
            switch (mo.unmodifiedBase) {
              case 'C':
                if ((mo.code === 'm') && (mo.strand === '+') && showM5CForwardEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M5C_FOR;
                }
                else if ((mo.code === 'h') && (mo.strand === '+') && showHM5CForwardEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_HM5C_FOR;
                }
                break;
              case 'G':
                if ((mo.code === 'm') && (mo.strand === '-') && showM5CReverseEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M5C_REV;
                }
                else if ((mo.code === 'h') && (mo.strand === '-') && showHM5CReverseEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_HM5C_REV;
                }
                break;
              case 'A':
                if ((mo.code === 'a') && (mo.strand === '+') && showM6AForwardEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M6A_FOR;
                }
                break
              case 'T':
                if ((mo.code === 'a') && (mo.strand === '-') && showM6AReverseEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M6A_REV;
                }
                break;
              default:
                break;
            }
            if (mmSegmentColor) {
              if ((mo.code === 'a') && ('M0A' in highlightPositions)) {
                const segmentModifiedOffsets = new Set(offsets.filter((d, i) => probabilities[i] < minProbabilityThreshold).map(d => d + segment.from));
                const highlight = 'M0A';
                const highlightLen = 1;
                const highlightWidth = Math.max(1, xScale(highlightLen) - xScale(0));
                const highlightColor = PILEUP_COLOR_IXS.HIGHLIGHTS_MZEROA;
                const highlightPosns = [...ATPositions].filter(d => !segmentModifiedOffsets.has(d));
                for (const highlightPosn of highlightPosns) {
                  if ((highlightPosn >= segment.from) && (highlightPosn <= segment.to)) {
                    xLeft = xScale(highlightPosn);
                    xRight = xLeft + highlightWidth;
                    addRect(xLeft, yTop, highlightWidth, height, highlightColor);
                  }
                }
              }

              const width = Math.max(1, xScale(offsetLength) - xScale(0));
              offsets
                .filter((d, i) => probabilities[i] >= minProbabilityThreshold && probabilities[i] < maxProbabilityThreshold)
                .map(filteredOffset => {
                  xLeft = xScale(segment.from + filteredOffset);
                  xRight = xLeft + width;
                  addRect(xLeft, yTop, width, height, mmSegmentColor);
                });
            }
          }
        }

        else if (trackOptions && trackOptions.indexDHS) {
          const indexDHSMetadata = (trackOptions.indexDHS) ? segment.metadata : {};
          let defaultSegmentColor = PILEUP_COLOR_IXS.BLACK;
          if (trackOptions.indexDHS) {
            defaultSegmentColor = PILEUP_COLOR_IXS[`INDEX_DHS_${indexDHSMetadata.rgb}`];
          }
          for (const substitution of segment.substitutions) {
            xLeft = xScale(segment.from + substitution.pos);
            const width = Math.max(1, xScale(substitution.length) - xScale(0));
            const insertionWidth = Math.max(1, xScale(0.1) - xScale(0));
            xRight = xLeft + width;

            if (substitution.variant === 'A') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.A);
            } else if (substitution.variant === 'C') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.C);
            } else if (substitution.variant === 'G') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.G);
            } else if (substitution.variant === 'T') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.T);
            } else if (substitution.type === 'S') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.S);
            } else if (substitution.type === 'H') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.H);
            } else if (substitution.type === 'X') {
              addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.X);
            } else if (substitution.type === 'I') {
              addRect(xLeft, yTop, insertionWidth, height, PILEUP_COLOR_IXS.I);
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
                  defaultSegmentColor,
                );
              }
            }
            else if (substitution.type === 'N') {

              // deletions so we're going to draw a thinner line
              // across
              const xMiddle = (yTop + yBottom) / 2;
              const delWidth = Math.min((yBottom - yTop) / 4.5, 1);

              const yMidTop = xMiddle - delWidth / 2;
              const yMidBottom = xMiddle + delWidth / 2;

              addRect(
                xLeft,
                yMidBottom,
                xRight - xLeft,
                delWidth,
                defaultSegmentColor,
              );
            }
            else {
              const indexDHSElementHeight = yScale.bandwidth() * 0.5;
              const indexDHSYTop = yTop + ((yBottom - yTop) * 0.25);
              addRect(xLeft, indexDHSYTop, width, indexDHSElementHeight, defaultSegmentColor);
            }
          }
          //
          // draw Index DHS summit
          //
          const indexDHSElementStart = segment.from - segment.chrOffset;
          const indexDHSSummitStart = indexDHSMetadata.summit.start;
          const indexDHSSummitEnd = indexDHSMetadata.summit.end;
          const indexDHSSummitLength = indexDHSSummitEnd - indexDHSSummitStart;
          const indexDHSSummitPos = indexDHSSummitStart - indexDHSElementStart;
          const indexDHSXLeft = xScale(segment.from + indexDHSSummitPos);
          const indexDHSYTop = yTop;
          const indexDHSWidth = Math.max(1, xScale(indexDHSSummitLength) - xScale(0));
          const indexDHSHeight = height;
          addRect(indexDHSXLeft, indexDHSYTop, indexDHSWidth, indexDHSHeight, defaultSegmentColor);
        }

        else if (trackOptions && trackOptions.ftFire) {
          const ftFireMetadata = (trackOptions.ftFire && trackOptions.ftFire.metadata) ? trackOptions.ftFire.metadata : null;
          if (ftFireMetadata) {
            const ftFireElementHeight = height * 0.25;
            const topCorrection = ftFireElementHeight * 1.75;
            const ftFireColors = ftFireMetadata.itemRGBMap;
            
            const nucleosomeData = segment.nucOffsets[0];
            let nucleosomeOffsets = nucleosomeData.offsets;
            let nucleosomeLengths = nucleosomeData.lengths;
            let nucleosomeColors = nucleosomeData.colors;
            let nucleosomeOffsetModifiers = nucleosomeData.offsetModifiers;
            let nucleosomeClipLength = nucleosomeData.clipLength;
            const mspData = segment.mspOffsets[0];
            const mspOffsets = mspData.offsets;
            const mspLengths = mspData.lengths;
            const mspColors = mspData.colors;

            /** draw molecule bounds before nucleosomes and MSPs */
            const firstNucleosomeOffset = nucleosomeOffsets[0];
            const lastNucleosomeOffsetEndpoint = nucleosomeOffsets[nucleosomeOffsets.length - 1] + nucleosomeLengths[nucleosomeLengths.length - 1];
            const firstMSPOffset = mspOffsets[0];
            const lastMSPOffsetEndpoint = mspOffsets[mspOffsets.length - 1] + mspLengths[mspLengths.length - 1];
            const moleculeOffset = 0; // Math.min(firstNucleosomeOffset, firstMSPOffset);
            const moleculeLength = segment.length; // Math.max(lastNucleosomeOffsetEndpoint, lastMSPOffsetEndpoint) - moleculeOffset;
            const moleculeColorIdx = PILEUP_COLOR_IXS[`BLACK_05`];
            const moleculeHeightFactor = 0.3;
            const moleculeWidth = Math.max(1, xScale(moleculeLength) - xScale(0));
            const moleculeXLeft = xScale(segment.from + moleculeOffset);
            const moleculeYTop = yTop + ((yBottom - yTop) * (1 - (0.125 * moleculeHeightFactor))) - topCorrection;
            const moleculeHeight = Math.max(1, ftFireElementHeight * moleculeHeightFactor);
            addRect(moleculeXLeft, moleculeYTop, moleculeWidth, moleculeHeight, moleculeColorIdx);

            if (segment.strand === '-') {
              nucleosomeOffsets = nucleosomeOffsets.map((d,i) => {
                return d - nucleosomeOffsetModifiers[nucleosomeOffsetModifiers.length - i - 1] - nucleosomeClipLength + 1;
              });
            }

            /** draw nucleosomes */
            for (let i = 0; i < nucleosomeOffsets.length; ++i) {
              const nucleosomeOffset = nucleosomeOffsets[i];
              const nucleosomeLength = nucleosomeLengths[i];
              const nucleosomeColor = nucleosomeColors[i];
              const nucleosomeColorIdx = PILEUP_COLOR_IXS[`FIRE_${nucleosomeColor}`];
              const nucleosomeHeightFactor = ftFireColors[nucleosomeColor].heightFactor;
              const nucleosomeWidth = Math.max(1, xScale(nucleosomeLength) - xScale(0));
              // const nucleosomeWidth = (segment.strand === '+') ? Math.max(1, xScale(nucleosomeLength) - xScale(0)) : Math.max(1, xScale(3/2*nucleosomeLength) - xScale(0));
              const nucleosomeXLeft = xScale(segment.from + nucleosomeOffset);
              // const nucleosomeXLeft = (segment.strand === '+') ? xScale(segment.from + nucleosomeOffset) : xScale(segment.from + (segment.length - nucleosomeOffset - (nucleosomeLength / 2)));
              const nucleosomeYTop = yTop + ((yBottom - yTop) * (1 - (0.125 * nucleosomeHeightFactor))) - topCorrection;
              addRect(nucleosomeXLeft, nucleosomeYTop, nucleosomeWidth, ftFireElementHeight * nucleosomeHeightFactor, nucleosomeColorIdx);
            }
            /** draw MSPs */
            for (let i = 0; i < mspOffsets.length; ++i) {
              const mspOffset = mspOffsets[i];
              const mspLength = mspLengths[i];
              const mspColor = mspColors[i];
              const mspColorIdx = PILEUP_COLOR_IXS[`FIRE_${mspColor}`];
              const mspHeightFactor = ftFireColors[mspColor].heightFactor;
              const mspWidth = Math.max(1, xScale(mspLength) - xScale(0));
              const mspXLeft = xScale(segment.from + mspOffset);
              const mspYTop = yTop + ((yBottom - yTop) * (1 - (0.125 * mspHeightFactor))) - topCorrection;
              addRect(mspXLeft, mspYTop, mspWidth, ftFireElementHeight * mspHeightFactor, mspColorIdx);
            }
          }
        }

        else if (trackOptions && trackOptions.fire) {
          const fireMetadata = (trackOptions.fire && trackOptions.fire.metadata) ? segment.metadata : {};
          const fireEnabledCategories = (trackOptions.fire && trackOptions.fire.enabledCategories) ? trackOptions.fire.enabledCategories : [];
          let defaultSegmentColor = PILEUP_COLOR_IXS.FIRE_BG;
          const fireElementHeight = yScale.bandwidth() * 0.25;
          const topCorrection = fireElementHeight * 1.75;

          // console.log(`segment.metadata.colors ${JSON.stringify(segment.metadata.colors)}`);

          for (const substitution of segment.substitutions) {
            xLeft = xScale(segment.from + substitution.pos);
            const width = Math.max(1, xScale(substitution.length) - xScale(0));
            xRight = xLeft + width;
            const fireYTop = yTop + ((yBottom - yTop) * 0.5) - topCorrection;
            addRect(xLeft, fireYTop, width, fireElementHeight, defaultSegmentColor);

            const colorMap = segment.metadata.colors;

            const blocks = segment.metadata.blocks;
            const blockSizes = blocks.sizes;
            const blockOffsets = blocks.offsets;
            const blockColors = blocks.colors.map((d => colorMap[d]));
            const blockColorIdxs = blocks.colors.map(d => PILEUP_COLOR_IXS[`FIRE_${colorMap[d]}`]);
            const blockHeightFactors = blocks.colors.map(d => trackOptions.fire.metadata.itemRGBMap[colorMap[d]].heightFactor);

            for (let i = 0; i < blocks.count; i++) {
              const blockColorRgb = blockColors[i];
              if (fireEnabledCategories.length === 0 || fireEnabledCategories.includes(blockColorRgb)) {
                const blockSize = blockSizes[i];
                const blockOffset = blockOffsets[i];
                const blockColorIdx = blockColorIdxs[i];
                const blockWidth = Math.max(1, xScale(blockSize) - xScale(0));
                const blockXLeft = xScale(segment.from + blockOffset);
                const blockYTop = yTop + ((yBottom - yTop) * (1 - (0.125 * blockHeightFactors[i]))) - topCorrection;
                addRect(blockXLeft, blockYTop, blockWidth, fireElementHeight * blockHeightFactors[i], blockColorIdx);
              }
            }
          }
        }
      });
    });
  }

  const positionsBuffer = allPositions.slice(0, currPosition).buffer;
  const colorsBuffer = allColors.slice(0, currColor).buffer;
  const ixBuffer = allIndexes.slice(0, currIdx).buffer;

  const objData = {
    rows: grouped,
    tileIds: tileIds,
    coverage: allReadCounts,
    coverageSamplingDistance,
    positionsBuffer,
    colorsBuffer,
    ixBuffer,
    xScaleDomain: domain,
    xScaleRange: scaleRange,
    clusterResultsToExport: clusterResultsToExport,
    drawnSegmentIdentifiers: drawnSegmentIdentifiers,
  };

  return Transfer(objData, [objData.positionsBuffer, colorsBuffer, ixBuffer]);
};

const cleanup = () => {
  // console.log("[higlass-pileup] cleanup function");
  Object.keys(bamFiles).forEach(key => delete bamFiles[key]);
  Object.keys(bamHeaders).forEach(key => delete bamHeaders[key]);
  Object.keys(dataOptions).forEach(key => delete dataOptions[key]);
  Object.keys(serverInfos).forEach(key => delete serverInfos[key]);
  Object.keys(chromSizes).forEach(key => delete chromSizes[key]);
  Object.keys(chromInfos).forEach(key => delete chromInfos[key]);
  Object.keys(tileValues).forEach(key => delete tileValues[key]);
  Object.keys(tilesetInfos).forEach(key => delete tilesetInfos[key]);
  Object.keys(dataConfs).forEach(key => delete dataConfs[key]);
  Object.keys(trackOptions).forEach(key => delete trackOptions[key]);
};

const tileFunctions = {
  init,
  serverInit,
  tilesetInfo,
  serverTilesetInfo,
  serverFetchTilesDebounced,
  fetchTilesDebounced,
  tile,
  cleanup,
  renderSegments,
  exportSegmentsAsBED12,
  exportTFBSOverlaps,
  exportIndexDHSOverlaps,
  exportSignalMatrices,
  exportUidTrackElements,
};

expose(tileFunctions);