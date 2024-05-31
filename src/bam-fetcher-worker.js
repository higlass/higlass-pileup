import { group, range } from 'd3-array';
import { scaleLinear, scaleBand } from 'd3-scale';
import { format } from 'd3-format';
import { expose, Transfer } from 'threads/worker';
import { BamFile } from '@gmod/bam'
import { getSubstitutions, calculateInsertSize, areMatesRequired, getMethylationOffsets, hexToRGBRawTriplet, indexDHSColors } from './bam-utils';
import LRU from 'lru-cache';
import { PILEUP_COLOR_IXS, replaceColorIdxs } from './bam-utils';
import { parseChromsizesRows, ChromosomeInfo } from './chrominfo-utils';
// import BAMDataFetcher from './bam-fetcher';
import { clusterData, euclideanDistance, jaccardDistance, averageDistance } from 'apr144-hclust';
import { RemoteFile } from 'generic-filehandle';

const dbscan = require('apr144-dbscan');

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

const bamRecordToJson = (bamRecord, chrName, chrOffset, trackOptions) => {
  const seq = bamRecord.get('seq');
  const from = +bamRecord.get('start') + 1 + chrOffset;
  const to = +bamRecord.get('end') + 1 + chrOffset;

  const segment = {
    id: bamRecord.get('id'),
    mate_ids: [], // split reads can have multiple mates
    start: +bamRecord.get('start') + 1,
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
    mm: bamRecord.get('MM'),
    ml: bamRecord.get('ML'),
    methylationOffsets: [],
  };

  if (segment.strand === '+' && trackOptions && trackOptions.plusStrandColor) {
    segment.color = PILEUP_COLOR_IXS.PLUS_STRAND;
  } 
  else if (segment.strand === '-' && trackOptions && trackOptions.minusStrandColor) {
    segment.color = PILEUP_COLOR_IXS.MINUS_STRAND;
  }

  const includeClippingOps = true;

  segment.substitutions = getSubstitutions(segment, seq, includeClippingOps);
  if (trackOptions.methylation) {
    segment.methylationOffsets = getMethylationOffsets(segment, seq, trackOptions.methylation.alignCpGEvents);
  }

  if (trackOptions.indexDHS) {
    segment.metadata = JSON.parse(bamRecord.get('CO'));
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
  // segment.substitutions.forEach((sub) => {
  //   // left soft clipped region
  //   if ((sub.type === "S" || sub.type === "H") && sub.pos < 0) {
  //     fromClippingAdjustment = -sub.length;
  //   } else if ((sub.type === "S" || sub.type === "H") && sub.pos > 0) {
  //     toClippingAdjustment = sub.length;
  //   }
  // });
  segment.fromWithClipping += fromClippingAdjustment;
  segment.toWithClipping += toClippingAdjustment;

  return segment;
};

// This will group the segments by readName and assign mates to reads
const findMates = (segments) => {

  const segmentsByReadName = groupBy(segments, "readName");

  Object.entries(segmentsByReadName).forEach(([readName, segmentGroup]) =>
    {
      if (segmentGroup.length === 2){
        const read = segmentGroup[0];
        const mate = segmentGroup[1];
        read.mate_ids = [mate.id];
        mate.mate_ids = [read.id];
      }
      else if (segmentGroup.length > 2){
        // It might be useful to distinguish reads from chimeric alignments in the future,
        // e.g., if we want to highlight read orientations of split reads. Not doing this for now.
        // See flags here: https://broadinstitute.github.io/picard/explain-flags.html
        // var supplementaryAlignmentMask = 1 << 11;
        // var firstInPairMask = 1 << 6;
        // const isFirstInPair = segment.flags & firstInPairMask;
        // const isSupplementaryAlignment = segment.flags & supplementaryAlignmentMask;

        // For simplicity a read will be a mate of every other read in the group.
        // it will only be used for the mouseover and it is probably useful, if the whole group is highlighted on hover
        const ids = segmentGroup.map((segment) => segment.id);
        segmentGroup.forEach((segment) => {
          segment.mate_ids = ids;
        });
      }
    }
  );

  return segmentsByReadName
}

const prepareHighlightedReads = (segments, trackOptions) => {
  
  const outlineMateOnHover =  trackOptions.outlineMateOnHover;
  const highlightIS = trackOptions.highlightReadsBy.includes('insertSize');
  const highlightPO = trackOptions.highlightReadsBy.includes('pairOrientation');
  const highlightISandPO = trackOptions.highlightReadsBy.includes('insertSizeAndPairOrientation');

  let segmentsByReadName;

  if (highlightIS || highlightPO || highlightISandPO) {
    segmentsByReadName = findMates(segments);
  } else if (outlineMateOnHover) {
    findMates(segments);
    return;
  } else {
    return;
  }

  Object.entries(segmentsByReadName).forEach(([readName, segmentGroup]) =>
    {
      // We are only highlighting insert size and pair orientation for normal (non chimeric reads)
      if (segmentGroup.length === 2){

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
    }
  );

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

    if (newRow.variants) {
      // server has returned information about variants in the form
      // (queryPos, referencePos, substitution)
      // modeled on pysam's get_aligned_pairs
      newRow.substitutions = newRow.variants.map((x) => ({
        pos: x[1] - (newRow.from - newRow.chrOffset) + 1,
        variant: x[2].toUpperCase(),
        length: 1,
      }));
    }

    if (newRow.cigars) {
      // server has returned cigar information
      // format: x[0] : start of region
      // x[1]: type of region (e.g. 'S', 'H', 'I', etc...)
      // x[2]: the length of the region
      for (const x of newRow.cigars) {
        newRow.substitutions.push({
          pos: x[0] - (newRow.from - newRow.chrOffset) + 1,
          type: x[1].toUpperCase(),
          length: x[2],
        });
      }
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
}

const init = (uid, bamUrl, baiUrl, fastaUrl, faiUrl, chromSizesUrl, options, tOptions) => {
  if (!options) {
    dataOptions[uid] = DEFAULT_DATA_OPTIONS;
  } else {
    dataOptions[uid] = {...DEFAULT_DATA_OPTIONS, ...options}
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
    bamHeaders[bamUrl] = bamFiles[bamUrl].getHeader();

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
  if(!chromInfos[chromSizesUrl]){
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
          range: "" // Will be used to show the bounds of this coverage bin when mousing over
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
  Object.entries(coverage).forEach(
      ([pos, entry]) => {
        const from = absToChr(pos);
        let range = from[0] + ":" + format(',')(from[1]);
        if(samplingDistance > 1){
          const to = absToChr(parseInt(pos,10)+samplingDistance-1);
          range += "-" + format(',')(to[1]);
        }
        entry.range = range;
      }
  );

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
  const {maxTileWidth, maxSampleSize} = dataOptions[uid];

  // console.log(`maxSampleSize ${maxSampleSize}`);

  const { bamUrl, fastaUrl, chromSizesUrl } = dataConfs[uid];
  const bamFile = bamFiles[bamUrl];
  const sequenceFile = (fastaUrl) ? (sequenceFiles[fastaUrl]) ? sequenceFiles[fastaUrl] : null : null;

  // console.log(`sequenceFile | ${fastaUrl} | ${JSON.stringify(sequenceFile)}`);

  return tilesetInfo(uid).then((tsInfo) => {
    const tileWidth = +tsInfo.max_width / 2 ** +z;
    const recordPromises = [];

    if (tileWidth > maxTileWidth) {
      // this.errorTextText('Zoomed out too far for this track. Zoomin further to see reads');
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
        };

        if (maxX > chromEnd) {
          
          // the visible region extends beyond the end of this chromosome
          // fetch from the start until the end of the chromosome
          recordPromises.push(
            bamFile
              // .getRecordsForRangeSample(
              //   chromName,
              //   minX - chromStart,
              //   chromEnd - chromStart,
              //   fetchOptions
              // )
              .getRecordsForRange(
                chromName,
                minX - chromStart,
                chromEnd - chromStart,
                fetchOptions
              )
              .then((records) => {
                // if (trackOptions[uid].methylation && trackOptions[uid].methylation.maxSegmentsPerTile) {
                //   const mappedRecordsWithMaxSegments = records.map((rec) =>
                //     bamRecordToJson(rec, chromName, cumPositions[i].pos, trackOptions[uid]),
                //   ).slice(0, trackOptions[uid].methylation.maxSegmentsPerTile);
                //   tileValues.set(
                //     `${uid}.${z}.${x}`,
                //     tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecordsWithMaxSegments),
                //   );
                // }
                // else {
                //   const mappedRecords = records.map((rec) =>
                //     bamRecordToJson(rec, chromName, cumPositions[i].pos, trackOptions[uid]),
                //   );
                //   tileValues.set(
                //     `${uid}.${z}.${x}`,
                //     tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                //   );
                // }
                // console.log(`records retrieved ${JSON.stringify(records.length)} | ${uid}.${z}.${x}`);
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(rec, chromName, cumPositions[i].pos, trackOptions[uid]),
                );
                tileValues.set(
                  `${uid}.${z}.${x}`,
                  tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                );
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
          // the end of the region is within this chromosome
          recordPromises.push(
            bamFile
              // .getRecordsForRangeSample(
              //   chromName, 
              //   startPos, 
              //   endPos, 
              //   fetchOptions
              // )
              .getRecordsForRange(
                chromName, 
                startPos, 
                endPos, 
                fetchOptions
              )
              .then((records) => {
                // if (trackOptions[uid].methylation && trackOptions[uid].methylation.maxSegmentsPerTile) {
                //   const mappedRecordsWithMaxSegments = records.map((rec) =>
                //     bamRecordToJson(rec, chromName, cumPositions[i].pos, trackOptions[uid]),
                //   ).slice(0, trackOptions[uid].methylation.maxSegmentsPerTile);
                //   tileValues.set(
                //     `${uid}.${z}.${x}`,
                //     tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecordsWithMaxSegments),
                //   );
                // }
                // else {
                //   const mappedRecords = records.map((rec) =>
                //     bamRecordToJson(rec, chromName, cumPositions[i].pos, trackOptions[uid]),
                //   );
                //   tileValues.set(
                //     `${uid}.${z}.${x}`,
                //     tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                //   );
                // }
                // console.log(`records retrieved ${JSON.stringify(records.length)} | ${uid}.${z}.${x}`);
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(rec, chromName, cumPositions[i].pos, trackOptions[uid]),
                );
                tileValues.set(
                  `${uid}.${z}.${x}`,
                  tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords),
                );
                return [];
              }),
          );

          if (sequenceFile) {
            // handle sequence data, if available
            recordPromises.push(
              // console.log(`A2 | pushing sequenceFile lookup into sequenceTileValues | ${chromName}:${startPos}-${endPos}`);
              sequenceFile
                .getSequence(
                  chromName,
                  startPos,
                  endPos,
                )
                .then((sequence) => {
                  // console.log(`A2 | sequence | ${uid}.${z}.${x} | ${startPos} | ${endPos} | ${sequence}`);
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
    const tilesetInfo = tilesetInfos[uid];
    let found = false;

    const [xStart, xEnd] = tilesetInfoToStartEnd(tilesetInfo, zoomLevel, tileX);

    while (zoomLevel > 0) {
      const hereTileId = `${uid}.${zoomLevel}.${tileX}`;

      if (tileValues.has(hereTileId)) {
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
  const url = `${serverInfos[uid].server}/tiles/?${serverTileIds.join('&')}`;

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

      const toRet = { ...existingTiles, ...newTiles };
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
      tiles[validTileId].tilePositionId = validTileId;
    }

    return tiles;
  });
};

///////////////////////////////////////////////////
/// Render Functions
///////////////////////////////////////////////////

// See segmentsToRows concerning the role of occupiedSpaceInRows
function assignSegmentToRow(segment, occupiedSpaceInRows, padding) {

  const segmentFromWithPadding = segment.fromWithClipping - padding;
  const segmentToWithPadding = segment.toWithClipping + padding;

  // no row has been assigned - find a suitable row and update the occupied space
  if (segment.row === null || segment.row === undefined) {
    // Go through each row and look if there is space for the segment
    for (let i = 0; i < occupiedSpaceInRows.length; i++) {
      if (!occupiedSpaceInRows[i]) {
        return;
      }
      const rowSpaceFrom = occupiedSpaceInRows[i].from;
      const rowSpaceTo = occupiedSpaceInRows[i].to;
      if (segmentToWithPadding < rowSpaceFrom) {
        segment.row = i;
        occupiedSpaceInRows[i] = {
          from: segmentFromWithPadding,
          to: rowSpaceTo,
        };
        return;
      } else if (segmentFromWithPadding > rowSpaceTo) {
        segment.row = i;
        occupiedSpaceInRows[i] = {
          from: rowSpaceFrom,
          to: segmentToWithPadding,
        };
        return;
      }
    }
    // There is no space in the existing rows, so add a new one.
    // console.log(`adding row to ${occupiedSpaceInRows.length} occupiedSpaceInRows rows`);
    segment.row = occupiedSpaceInRows.length;
    occupiedSpaceInRows.push({
      from: segmentFromWithPadding,
      to: segmentToWithPadding,
    });
  }
  // segment already has a row - just update the occupied space
  else {
    const assignedRow = segment.row;
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

function segmentsToRows(segments, optionsIn) {
  const { prevRows, padding } = Object.assign(
    { prevRows: [], padding: 5 },
    optionsIn || {},
  );

  // The following array contains elements fo the form
  // occupiedSpaceInRows[i] = {from: 100, to: 110}
  // This means that in row i, the space from 100 to 110 is occupied and reads cannot be placed there
  // This array is updated with every segment that is added to the scene
  let occupiedSpaceInRows = [];
  const segmentIds = new Set(segments.map((x) => x.id));

  // We only need those previous segments, that are in the current segments list
  const prevSegments = prevRows
    .flat()
    .filter((segment) => segmentIds.has(segment.id));

  const maxRows = (optionsIn.maxRows) ? optionsIn.maxRows : null;

  for (let i = 0; i < prevSegments.length; i++) {
    // prevSegments contains already assigned segments. The function below therefore just
    // builds the occupiedSpaceInRows array. For this, prevSegments does not need to be sorted
    assignSegmentToRow(prevSegments[i], occupiedSpaceInRows, padding);
  }

  const prevSegmentIds = new Set(prevSegments.map((x) => x.id));

  let newSegments = [];
  // We need to assign rows only to those segments, that are not in the prevSegments list
  const filteredSegments = segments.filter((x) => !prevSegmentIds.has(x.id));

  if (prevSegments.length === 0) {
    filteredSegments.sort((a, b) => a.fromWithClipping - b.fromWithClipping);
    for (const segment of filteredSegments) {
      assignSegmentToRow(segment, occupiedSpaceInRows, padding);
    }
    // filteredSegments.forEach((segment) => {
    //   assignSegmentToRow(segment, occupiedSpaceInRows, padding);
    // });
    newSegments = filteredSegments;
  } else {
    // We subdivide the segments into those that are left/right of the existing previous segments
    // Note that prevSegments is sorted
    const cutoff =
      (prevSegments[0].fromWithClipping + prevSegments[prevSegments.length - 1].to) / 2;
    const newSegmentsLeft = filteredSegments.filter((x) => x.fromWithClipping <= cutoff);
    // The sort order for new segments that are appended left is reversed
    newSegmentsLeft.sort((a, b) => b.fromWithClipping - a.fromWithClipping);
    for (const segment of newSegmentsLeft) {
      assignSegmentToRow(segment, occupiedSpaceInRows, padding);
    }
    // newSegmentsLeft.forEach((segment) => {
    //   assignSegmentToRow(segment, occupiedSpaceInRows, padding);
    // });

    const newSegmentsRight = filteredSegments.filter((x) => x.fromWithClipping > cutoff);
    newSegmentsRight.sort((a, b) => a.fromWithClipping - b.fromWithClipping);
    for (const segment of newSegmentsRight) {
      assignSegmentToRow(segment, occupiedSpaceInRows, padding);
    }
    // newSegmentsRight.forEach((segment) => {
    //   assignSegmentToRow(segment, occupiedSpaceInRows, padding);
    // });

    newSegments = newSegmentsLeft.concat(prevSegments, newSegmentsRight);
  }

  const outputRows = [];
  for (let i = 0; i < occupiedSpaceInRows.length; i++) {
    outputRows[i] = newSegments.filter((x) => x.row === i);
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

const exportSegmentsAsBED12 = (
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
    if (segmentList[i].from < minPos) {
      minPos = segmentList[i].from;
    }

    if (segmentList[i].to > maxPos) {
      maxPos = segmentList[i].to;
    }
  }
  let grouped = null;

  // group by some attribute or don't
  if (groupBy) {
    let groupByOption = trackOptions && trackOptions.groupBy;
    groupByOption = groupByOption ? groupByOption : null;
    grouped = groupBy(segmentList, groupByOption);
  } else {
    grouped = { null: segmentList };
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
                case 'Full region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Partial region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Full region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Partial region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Full region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Partial region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                break;
              case 'G':
                if ((mo.code === 'm') && (mo.strand === '-') && showM5CReverseEvents) {
                  mmSegmentColor = null; // PILEUP_COLOR_IXS.MM_M5C_REV;
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

const renderSegments = (
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
  clusterDataObj,
  clusterReorderDataObj,
) => {
  
  // if (clusterReorderDataObj) {
  //   console.log(`clusterReorderDataObj (renderSegments start) ${JSON.stringify(clusterReorderDataObj)}`);
  //   return;
  // }

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

    const sequenceTileValue = sequenceTileValues.get(`${uid}.${tileId}`);

    if (sequenceTileValue && trackOptions.methylation && trackOptions.methylation.highlights) {
      const highlights = Object.keys(trackOptions.methylation.highlights);
      for (const sequence of sequenceTileValue) {
        // allSequences[parseInt(sequence.start)] = sequence.data;
        const absPosStart = parseInt(sequence.start) + parseInt(sequence.chromOffset);
        const seq = sequence.data.toUpperCase();
        for (const highlight of highlights) {
          // console.log(`highlight ${JSON.stringify(highlight)}`);
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
            // console.log(`posnA ${posnA} | posnT ${posnT} | posn ${posn}`);
            if (isEmpty(highlightPositions) || !highlightPositions[highlight]) highlightPositions[highlight] = new Array();
            while (posn > -1) {
              highlightPositions[highlight].push(posn + absPosStart + 1); // 1-based indexed positions!
              posnA = seq.indexOf('A', posn + 1);
              posnT = seq.indexOf('T', posn + 1);
              posn = ((posnA !== -1) && (posnT !== -1)) ? Math.min(posnA, posnT) : (posnA === -1) ? posnT : (posnT === -1) ? posnA : -1;
              // console.log(`posnA ${posnA} | posnT ${posnT} | posn ${posn}`);
            }
            // console.log(`highlightPositions[${highlight}] ${highlightPositions[highlight]}`);
            ATPositions = new Set([...highlightPositions[highlight]]);
          }
        }
        // highlights.forEach((highlight) => {
        //   // console.log(`highlight ${JSON.stringify(highlight)}`);
        //   const highlightUC = highlight.toUpperCase();
        //   const highlightLength = highlight.length;
        //   let posn = seq.indexOf(highlightUC);
        //   if (isEmpty(highlightPositions) || !highlightPositions[highlight]) highlightPositions[highlight] = new Array();
        //   while (posn > -1) {
        //     highlightPositions[highlight].push(posn + absPosStart + 1); // 1-based indexed positions!
        //     posn = seq.indexOf(highlightUC, posn + highlightLength);
        //   }
        // });
      }
    }
  }

  // if (!isEmpty(highlightPositions)) console.log(`highlightPositions ${JSON.stringify(highlightPositions)}`);

  let segmentList = Object.values(allSegments);

  if (trackOptions.minMappingQuality > 0){
    segmentList = segmentList.filter((s) => s.mapq >= trackOptions.minMappingQuality)
  }

  prepareHighlightedReads(segmentList, trackOptions);

  if (areMatesRequired(trackOptions) && (!clusterDataObj || !clusterReorderDataObj)) {
    // At this point reads are colored correctly, but we only want to align those reads that
    // are within the visible tiles - not mates that are far away, as this can mess up the alignment
    let tileMinPos = Number.MAX_VALUE;
    let tileMaxPos = -Number.MAX_VALUE;
    const tsInfo = tilesetInfos[uid];
    for (const id of tileIds) {
      const z = id.split('.')[0];
      const x = id.split('.')[1];
      const startEnd = tilesetInfoToStartEnd(tsInfo, +z, +x);
      tileMinPos = Math.min(tileMinPos, startEnd[0]);
      tileMaxPos = Math.max(tileMaxPos, startEnd[1]);
    }
    // tileIds.forEach((id) => {
    //   const z = id.split('.')[0];
    //   const x = id.split('.')[1];
    //   const startEnd = tilesetInfoToStartEnd(tsInfo, +z, +x);
    //   tileMinPos = Math.min(tileMinPos, startEnd[0]);
    //   tileMaxPos = Math.max(tileMaxPos, startEnd[1]);
    // });

    segmentList = segmentList.filter(
      (segment) => segment.to >= tileMinPos && segment.from <= tileMaxPos,
    );
  }
  
  let [minPos, maxPos] = [Number.MAX_VALUE, -Number.MAX_VALUE];

  for (let i = 0; i < segmentList.length; i++) {
    if (segmentList[i].from < minPos) {
      minPos = segmentList[i].from;
    }

    if (segmentList[i].to > maxPos) {
      maxPos = segmentList[i].to;
    }
  }
  let grouped = null;

  // group by some attribute or don't
  if (groupBy) {
    let groupByOption = trackOptions && trackOptions.groupBy;
    groupByOption = groupByOption ? groupByOption : null;
    grouped = groupBy(segmentList, groupByOption);
  } else {
    grouped = { null: segmentList };
  }

  let clusterResultsToExport = null;

  // calculate the the rows of reads for each group
  if ((clusterDataObj || clusterReorderDataObj) && trackOptions.methylation) {
    // console.log(`clusterDataObj.range ${JSON.stringify(clusterDataObj.range)}`);
    // const chromName = clusterDataObj.range.left.chrom;

    const clusterDataObjToUse = (clusterDataObj) ? clusterDataObj : clusterReorderDataObj;

    const reorderIndexList = (clusterReorderDataObj) ? clusterReorderDataObj.order : null;
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

    // console.log(`probabilityThresholdRange ${JSON.stringify(probabilityThresholdRange)}`);
    let distanceFnToCall = null;
    const eventVecLen = chromEnd - chromStart;
    const nReads = segmentList.length;
    // console.log(`nReads ${JSON.stringify(nReads)}`);
    const data = new Array();
    let allowedRowIdx = 0;
    const trueRow = {};

    // console.log(`trackOptions ${JSON.stringify(trackOptions)}`);
    // console.log(`chromStart ${JSON.stringify(chromStart)} | chromEnd ${JSON.stringify(chromEnd)}`);

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
              const mos = segment.methylationOffsets;
              
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Full region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Partial region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
              const mos = segment.methylationOffsets;

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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Full region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Partial region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
            throw new Error(`Cluster distance function [${distanceFn}] is unknown or unsupported for subregion cluster matrix construction`);
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
              const mos = segment.methylationOffsets;

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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Full region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                case 'Partial region':
                  if ((segmentStart < chromStart) && (segmentEnd > chromEnd)) {
                    const offsetStart = chromStart - segmentStart;
                    const offsetEnd = offsetStart + eventVecLen;
                    for (const mo of mos) {
                      const offsets = mo.offsets;
                      const probabilities = mo.probabilities;
                      if ((eventCategories.includes('m6A+') && mo.unmodifiedBase === 'A') 
                        || (eventCategories.includes('m6A-') && mo.unmodifiedBase === 'T')
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
                        || (eventCategories.includes('5mC') && mo.unmodifiedBase === 'C')) {
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
        }
        break;
      default:
        throw new Error(`Cluster method [${method}] is unknown or unsupported for subregion cluster matrix construction`);
    }

    if (data.length > 0) {
      switch (method) {
        case 'AGNES':
          // console.log(`data ${JSON.stringify(data)}`);
          const { clusters, distances, order, clustersGivenK } = clusterData({
            data: data,
            distance: distanceFnToCall,
            linkage: averageDistance,
          });
          clusterResultsToExport = (clusterDataObj) ? clusters : null;
          // console.log(`order ${order}`);
          const rowOrdering = (clusterDataObj) ? order : reorderIndexList;
          console.log(`using ${(clusterDataObj) ? 'clusterDataObj' : 'clusterReorderDataObj'} for row ordering`);
          const orderedSegments = rowOrdering.map(i => {
            const trueRowIdx = trueRow[i];
            const segment = segmentList[trueRowIdx];
            return [segment];
          })
          // console.log(`orderedSegments ${JSON.stringify(orderedSegments)}`);
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
          clusterResultsToExport = (clusterDataObj) ? results : null;
          // console.log(`result ${JSON.stringify(result)}`);
          if (results.clusters.length > 0) {
            const rowOrdering = (clusterDataObj) ? flatten(results.clusters.concat(results.noise)) : reorderIndexList;
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
  else {
    for (let key of Object.keys(grouped)) {
      const rows = segmentsToRows(grouped[key], {
        prevRows: (prevRows[key] && prevRows[key].rows) || [],
        // maxRows: (trackOptions.methylation && trackOptions.methylation.maxRows) ? trackOptions.methylation.maxRows : null,
      });
      // console.log(`uid ${uid} | rows ${JSON.stringify(rows)}`);
      // At this point grouped[key] also contains all the segments (as array), but we only need grouped[key].rows
      // Therefore we get rid of everything else to save memory and increase performance
      grouped[key] = {};
      // if (trackOptions.methylation && trackOptions.methylation.maxRows) {
      //   grouped[key].rows = rows.slice(0, trackOptions.methylation.maxRows);
      // }
      // else {
      //   grouped[key].rows = rows;
      // }
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
    const result = getCoverage(uid, segmentList, coverageSamplingDistance);

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
    const fiberPadding = (trackOptions && trackOptions.indexDHS) ? 0.25 : (trackOptions && trackOptions.methylation && trackOptions.methylation.hasOwnProperty('fiberPadding')) ? trackOptions.methylation.fiberPadding : 0.25;
    const yScale = scaleBand().domain(d).range(r).paddingInner(fiberPadding);

    let xLeft;
    let xRight;
    let yTop;
    let yBottom;

    // let pileupSegmentsDrawn = 0;

    rows.map((row, i) => {
      yTop = yScale(i);
      const height = yScale.bandwidth();
      yBottom = yTop + height;

      row.map((segment, j) => {
        const from = xScale(segment.from);
        const to = xScale(segment.to);

        xLeft = from;
        xRight = to;

        if (trackOptions && trackOptions.indexDHS) {
          // console.log(`PILEUP_COLOR_IXS.INDEX_DHS_BG ${PILEUP_COLOR_IXS.INDEX_DHS_BG} vs segment.color ${segment.color} or segment.colorOverride ${segment.colorOverride}`);
          addRect(xLeft, yTop, xRight - xLeft, height, PILEUP_COLOR_IXS.INDEX_DHS_BG);
        }
        else {
          addRect(xLeft, yTop, xRight - xLeft, height, segment.colorOverride || segment.color);
          // pileupSegmentsDrawn += 1;
        }

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
              // else if (highlight === 'M0A') {
              //   for (const posn of highlightPosns) {
              //     if (posn >= segment.from && posn < segment.to) {
              //       xLeft = xScale(posn);
              //       xRight = xLeft + highlightWidth;
              //       addRect(xLeft, yTop, highlightWidth, height, highlightColor);
              //     }
              //   }
              // }
            }
            // highlights.forEach((highlight) => {
            //   const highlightLen = highlight.length;
            //   const highlightWidth = Math.max(1, xScale(highlightLen) - xScale(0));
            //   const highlightColor = PILEUP_COLOR_IXS[`HIGHLIGHTS_${highlight}`];
            //   const highlightPosns = highlightPositions[highlight];
            //   if (highlight !== 'M0A') {
            //     highlightPosns.forEach((posn) => {
            //       if (posn >= segment.from && posn < segment.to) {
            //         xLeft = xScale(posn);
            //         xRight = xLeft + highlightWidth;
            //         addRect(xLeft, yTop, highlightWidth, height, highlightColor);
            //       }
            //     })
            //   }
            // });
          }

          //
          // render methylation events
          //
          const showM5CForwardEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5mC+');
          const showM5CReverseEvents = trackOptions && trackOptions.methylation && trackOptions.methylation.categoryAbbreviations && trackOptions.methylation.categoryAbbreviations.includes('5mC-');
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
                break;
              case 'G':
                if ((mo.code === 'm') && (mo.strand === '-') && showM5CReverseEvents) {
                  mmSegmentColor = PILEUP_COLOR_IXS.MM_M5C_REV;
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
                // console.log(`segmentModifiedOffsets ${JSON.stringify(segmentModifiedOffsets)}`);
                // const segmentModifiedOffsetMin = Math.min(...segmentModifiedOffsets);
                // const segmentModifiedOffsetMax = Math.max(...segmentModifiedOffsets);
                const highlight = 'M0A';
                const highlightLen = 1;
                const highlightWidth = Math.max(1, xScale(highlightLen) - xScale(0));
                const highlightColor = PILEUP_COLOR_IXS.HIGHLIGHTS_MZEROA;
                // console.log(`highlightColor ${highlightColor}`);
                // const highlightPosns = highlightPositions[highlight].filter(d => !segmentModifiedOffsets.includes(d));
                const highlightPosns = [...ATPositions].filter(d => !segmentModifiedOffsets.has(d));
                // console.log(`highlightPositions[highlight] ${highlightPositions[highlight].length}`);
                // console.log(`highlightPosns ${highlightPosns.length}`);
                for (const highlightPosn of highlightPosns) {
                  if ((highlightPosn >= segment.from) && (highlightPosn <= segment.to)) {
                    xLeft = xScale(highlightPosn);
                    xRight = xLeft + highlightWidth;
                    addRect(xLeft, yTop, highlightWidth, height, highlightColor);
                  }
                }
              }
              // let offsetIdx = 0;
              // const width = 1;
              // for (const offset of offsets) {
              //   const probability = probabilities[offsetIdx];
              //   if (probability >= minProbabilityThreshold && probability < maxProbabilityThreshold) {
              //     // console.log(`segment.from + offset -> | ${segment.from} | ${offset} | ${segment.from + offset}`);
              //     xLeft = xScale(segment.from + offset); // 'from' uses 1-based index
              //     // const width = Math.max(1, xScale(offsetLength) - xScale(0));
              //     // xRight = xLeft + width;
              //     addRect(xLeft, yTop, width, height, mmSegmentColor);
              //   }
              //   offsetIdx++;
              // }

              // const offsetWidth = 1;
              // const filteredOffsets = offsets.filter((d, i) => probabilities[i] >= minProbabilityThreshold && probabilities[i] < maxProbabilityThreshold);
              // for (const filteredOffset of filteredOffsets) {
              //   xLeft = xScale(segment.from + filteredOffset);
              //   addRect(xLeft, yTop, offsetWidth, height, mmSegmentColor);
              // }

              // const offsetWidth = 1;
              // offsets
              //   .filter((d, i) => probabilities[i] >= minProbabilityThreshold && probabilities[i] < maxProbabilityThreshold)
              //   .map(filteredOffset => {
              //     xLeft = xScale(segment.from + filteredOffset);
              //     addRect(xLeft, yTop, offsetWidth, height, mmSegmentColor);
              //   })

              const width = Math.max(1, xScale(offsetLength) - xScale(0));
              offsets
                .filter((d, i) => probabilities[i] >= minProbabilityThreshold && probabilities[i] < maxProbabilityThreshold)
                .map(filteredOffset => {
                  // if (mmSegmentColor === PILEUP_COLOR_IXS.MM_M5C_FOR) {
                  //   console.log(`segment.from + filteredOffset - chrOffset ${segment.from + filteredOffset - segment.chrOffset} | filteredOffset ${filteredOffset} | segment.from ${segment.from} | segment.chrOffset ${segment.chrOffset}`);
                  // }
                  xLeft = xScale(segment.from + filteredOffset);
                  // if ((mmSegmentColor === PILEUP_COLOR_IXS.MM_M5C_FOR) && trackOptions.methylation.alignCpGEvents && segment.strand === '-') {
                    // console.log(`segment.from + filteredOffset - chrOffset ${segment.from + filteredOffset - segment.chrOffset} | filteredOffset ${filteredOffset} | segment.from ${segment.from} | segment.chrOffset ${segment.chrOffset} | segment.strand ${segment.strand}`);
                  //   xLeft -= width;
                  // }
                  xRight = xLeft + width;
                  addRect(xLeft, yTop, width, height, mmSegmentColor);
                });
            }
          }
        }

        if (trackOptions && trackOptions.indexDHS) {
          // console.log(`segment ${JSON.stringify(segment, null, 2)}`);
          //
          // apply color to segment, if available
          //
          const indexDHSMetadata = (trackOptions.indexDHS) ? segment.metadata : {};
          let defaultSegmentColor = PILEUP_COLOR_IXS.BLACK;
          if (trackOptions.indexDHS) {
            defaultSegmentColor = PILEUP_COLOR_IXS[`INDEX_DHS_${indexDHSMetadata.rgb}`];
            // if ('M0A' in highlightPositions) defaultSegmentColor += 1;
            // console.log(`indexDHSMetadata ${JSON.stringify(indexDHSMetadata)}`);
          }
          // if (segment.substitutions.length === 1) {
          //   const newSubstitutions = [];
          //   let offset = 0;
          //   let length = 1;
          //   let rangeStart = segment.start;
          //   let rangeEnd = segment.start + 1;
          //   newSubstitutions.push({
          //     pos: offset,
          //     length: length,
          //     range: [
          //       rangeStart,
          //       rangeEnd,
          //     ],
          //     type: 'M',
          //   });
          //   offset += length;
          //   length = segment.to - segment.from - offset - 1;
          //   rangeStart = rangeEnd;
          //   rangeEnd = rangeStart + length; 
          //   newSubstitutions.push({
          //     pos: 1,
          //     length: length,
          //     range: [
          //       rangeStart,
          //       rangeEnd,
          //     ],
          //     type: 'N',
          //   });
          //   offset += length;
          //   length = 1;
          //   rangeStart = rangeEnd;
          //   rangeEnd = rangeStart + 1;
          //   newSubstitutions.push({
          //     pos: offset,
          //     length: length,
          //     range: [
          //       rangeStart,
          //       rangeEnd,
          //     ],
          //     type: 'M',
          //   });
          //   segment.substitutions = newSubstitutions;
          // }
          // const width = 1;
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
            } else if (substitution.type === 'N') {
              
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

              // addRect(
              //   xLeft,
              //   yTop,
              //   xRight - xLeft,
              //   yMidTop - yTop,
              //   PILEUP_COLOR_IXS.N,
              // );
              // addRect(
              //   xLeft,
              //   yMidBottom,
              //   width,
              //   yBottom - yMidBottom,
              //   PILEUP_COLOR_IXS.N,
              // );

              // let currPos = xLeft;
              // const DASH_LENGTH = 6;
              // const DASH_SPACE = 4;

              // draw dashes
              // while (currPos <= xRight) {
              //   // make sure the last dash doesn't overrun
              //   const dashLength = Math.min(DASH_LENGTH, xRight - currPos);

              //   addRect(
              //     currPos,
              //     yMidTop,
              //     dashLength,
              //     delWidth,
              //     PILEUP_COLOR_IXS.N,
              //   );
              //   currPos += DASH_LENGTH + DASH_SPACE;
              // }
              // allready handled above
            } else {
              const indexDHSElementHeight = yScale.bandwidth() * 0.5;
              const indexDHSYTop = yTop + ((yBottom - yTop) * 0.25);
              addRect(xLeft, indexDHSYTop, width, indexDHSElementHeight, defaultSegmentColor);
            }
          }
          //
          // draw Index DHS summit
          //
          if (trackOptions && trackOptions.indexDHS) {
            // console.log(`PILEUP_COLOR_IXS ${JSON.stringify(PILEUP_COLOR_IXS)}`);
            const indexDHSElementStart = segment.from - segment.chrOffset;
            const indexDHSSummitStart = indexDHSMetadata.summit.start;
            const indexDHSSummitEnd = indexDHSMetadata.summit.end;
            const indexDHSSummitLength = indexDHSSummitEnd - indexDHSSummitStart;
            const indexDHSSummitPos = indexDHSSummitStart - indexDHSElementStart;
            const indexDHSXLeft = xScale(segment.from + indexDHSSummitPos);
            const indexDHSYTop = yTop;
            const indexDHSWidth = Math.max(1, xScale(indexDHSSummitLength) - xScale(0));
            const indexDHSHeight = height;
            // const indexDHSXRight = indexDHSXLeft + indexDHSWidth;
            addRect(indexDHSXLeft, indexDHSYTop, indexDHSWidth, indexDHSHeight, defaultSegmentColor);
          }
        }
      });
    });

    // console.log(`pileupSegmentsDrawn ${pileupSegmentsDrawn}`);
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
  };

  return Transfer(objData, [objData.positionsBuffer, colorsBuffer, ixBuffer]);
};

const tileFunctions = {
  init,
  serverInit,
  tilesetInfo,
  serverTilesetInfo,
  serverFetchTilesDebounced,
  fetchTilesDebounced,
  tile,
  renderSegments,
  exportSegmentsAsBED12,
};

expose(tileFunctions);
