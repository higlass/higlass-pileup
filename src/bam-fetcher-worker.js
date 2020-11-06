import { text } from 'd3-request';
import { bisector, range } from 'd3-array';
import { tsvParseRows } from 'd3-dsv';
import { scaleLinear, scaleBand } from 'd3-scale';
import { expose, Transfer } from 'threads/worker';
import { BamFile } from '@gmod/bam';
import { getSubstitutions } from './bam-utils';
import LRU from 'lru-cache';
import { PILEUP_COLORS, PILEUP_COLOR_IXS } from './bam-utils';

function currTime() {
  const d = new Date();
  return d.getTime();
}
/////////////////////////////////////////////////
/// ChromInfo
/////////////////////////////////////////////////

const chromInfoBisector = bisector((d) => d.pos).left;
const segmentFromBisector = bisector((d) => d.from).right;

const groupBy = (xs, key) =>
  xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});

const chrToAbs = (chrom, chromPos, chromInfo) =>
  chromInfo.chrPositions[chrom].pos + chromPos;

const absToChr = (absPosition, chromInfo) => {
  if (!chromInfo || !chromInfo.cumPositions || !chromInfo.cumPositions.length) {
    return null;
  }

  let insertPoint = chromInfoBisector(chromInfo.cumPositions, absPosition);
  const lastChr = chromInfo.cumPositions[chromInfo.cumPositions.length - 1].chr;
  const lastLength = chromInfo.chromLengths[lastChr];

  insertPoint -= insertPoint > 0 && 1;

  let chrPosition = Math.floor(
    absPosition - chromInfo.cumPositions[insertPoint].pos,
  );
  let offset = 0;

  if (chrPosition < 0) {
    // before the start of the genome
    offset = chrPosition - 1;
    chrPosition = 1;
  }

  if (
    insertPoint === chromInfo.cumPositions.length - 1 &&
    chrPosition > lastLength
  ) {
    // beyond the last chromosome
    offset = chrPosition - lastLength;
    chrPosition = lastLength;
  }

  return [
    chromInfo.cumPositions[insertPoint].chr,
    chrPosition,
    offset,
    insertPoint,
  ];
};

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

function parseChromsizesRows(data) {
  const cumValues = [];
  const chromLengths = {};
  const chrPositions = {};

  let totalLength = 0;

  for (let i = 0; i < data.length; i++) {
    const length = Number(data[i][1]);
    totalLength += length;

    const newValue = {
      id: i,
      chr: data[i][0],
      pos: totalLength - length,
    };

    cumValues.push(newValue);
    chrPositions[newValue.chr] = newValue;
    chromLengths[data[i][0]] = length;
  }

  return {
    cumPositions: cumValues,
    chrPositions,
    totalLength,
    chromLengths,
  };
}

function ChromosomeInfo(filepath, success) {
  const ret = {};

  ret.absToChr = (absPos) => (ret.chrPositions ? absToChr(absPos, ret) : null);

  ret.chrToAbs = ([chrName, chrPos] = []) =>
    ret.chrPositions ? chrToAbs(chrName, chrPos, ret) : null;

  return text(filepath, (error, chrInfoText) => {
    if (error) {
      // console.warn('Chromosome info not found at:', filepath);
      if (success) success(null);
    } else {
      const data = tsvParseRows(chrInfoText);
      const chromInfo = parseChromsizesRows(data);

      Object.keys(chromInfo).forEach((key) => {
        ret[key] = chromInfo[key];
      });
      if (success) success(ret);
    }
  });
}

/////////////////////////////////////////////////////
/// End Chrominfo
/////////////////////////////////////////////////////

const bamRecordToJson = (bamRecord, chrName, chrOffset) => {

  const seq = bamRecord.get('seq');

  const segment = {
    id: bamRecord._id,
    from: +bamRecord.data.start + 1 + chrOffset,
    to: +bamRecord.data.end + 1 + chrOffset,
    md: bamRecord.get('MD'),
    chrName,
    chrOffset,
    cigar: bamRecord.get('cigar'),
    mapq: bamRecord.get('mq'),
    strand: bamRecord.get('strand') === 1 ? '+' : '-',
    substitutions: []
  }

  segment["substitutions"] = getSubstitutions(segment, seq);

  return segment;
};

const tabularJsonToRowJson = (tabularJson) => {
  const rowJson = [];

  const headers = Object.keys(tabularJson);

  for (let i = 0; i < tabularJson[headers[0]].length; i++) {
    const newRow = {};

    for (let j = 0; j < headers.length; j++) {
      newRow[headers[j]] = tabularJson[headers[j]][i];
    }

    rowJson.push(newRow);
  }

  return rowJson;
};

// promises indexed by urls
const bamFiles = {};
const bamHeaders = {};

const serverInfos = {};

const MAX_TILES = 20;

// promises indexed by url
const chromSizes = {};
const chromInfos = {};
const tileValues = new LRU({ max: MAX_TILES });
const tilesetInfos = {};

// indexed by uuid
const dataConfs = {};

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

const init = (uid, bamUrl, baiUrl, chromSizesUrl) => {
  if (!bamFiles[bamUrl]) {
    bamFiles[bamUrl] = new BamFile({
      bamUrl,
      baiUrl
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

const getReadCounts = (allSegments) => {

  const segmentList = Object.values(allSegments);
  const readCounts = {};
  let maxReadCount = 0;

  for (let j = 0; j < segmentList.length; j++) {
    const from = segmentList[j].from;
    const to = segmentList[j].to;

    for(let i = from; i<to; i++){
      if(!readCounts[i]){
        readCounts[i] = {
          reads: 0,
          matches: 0,
          variants: {
            A: 0,
            C: 0,
            G: 0,
            T: 0,
            N: 0,
          }
          
        }
      }
      readCounts[i].reads++;
      readCounts[i].matches++;
      maxReadCount = Math.max(maxReadCount,readCounts[i].reads);
    }

    segmentList[j].substitutions.forEach(substitution => {
      if(substitution.variant){
        const posSub = from + substitution.pos;
        readCounts[posSub].matches--;
        if(!readCounts[posSub]['variants'][substitution.variant]){
          readCounts[posSub]['variants'][substitution.variant] = 0;
        }
        readCounts[posSub]['variants'][substitution.variant]++;
      }
    });
  }

  return {
    readCounts: readCounts,
    maxReadCount: maxReadCount,
}
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
  const MAX_TILE_WIDTH = 200000;
  const { bamUrl, chromSizesUrl } = dataConfs[uid];
  const bamFile = bamFiles[bamUrl];

  return tilesetInfo(uid).then((tsInfo) => {
    const tileWidth = +tsInfo.max_width / 2 ** +z;
    const recordPromises = [];

    if (tileWidth > MAX_TILE_WIDTH) {
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

      if (chromStart <= minX && minX < chromEnd) {
        // start of the visible region is within this chromosome

        if (maxX > chromEnd) {
          // the visible region extends beyond the end of this chromosome
          // fetch from the start until the end of the chromosome
          recordPromises.push(
            bamFile
              .getRecordsForRange(
                chromName,
                minX - chromStart,
                chromEnd - chromStart,
              )
              .then((records) => {
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(rec, chromName, cumPositions[i].pos),
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
              .getRecordsForRange(chromName, startPos, endPos, {
                // viewAsPairs: true,
                // maxInsertSize: 2000,
              })
              .then((records) => {
                const mappedRecords = records.map((rec) =>
                  bamRecordToJson(rec, chromName, cumPositions[i].pos),
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

const serverFetchTilesDebounced = async (uid, tileIds) => {
  const serverInfo = serverInfos[uid];
  const existingTiles = {};
  const toFetchIds = [];

  // first let's check if we have a larger tile that contains this one
  for (const tileId of tileIds) {
    let [zoomLevel, tileX] = tileId.split('.');
    const tilesetInfo = tilesetInfos[uid];
    const found = false;

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

function segmentsToRows(segments, optionsIn) {
  const t1 = currTime();

  const { prevRows, padding } = Object.assign(
    { prevRows: [], padding: 5 },
    optionsIn || {},
  );

  segments.sort((a, b) => a.from - b.from);

  const rowIds = new Set(prevRows.flatMap((x) => x).map((x) => x.id));

  // we only want to go through the segments that
  // don't already have a row
  const filteredSegments = segments.filter((x) => !rowIds.has(x.id));

  // we also want to remove all row entries that are
  // not in our list of segments
  const segmentIds = new Set(segments.map((x) => x.id));

  // also, remove all rows that don't have any entries remaining
  const newRows = prevRows
    .map((row) => row.filter((segment) => segmentIds.has(segment.id)))
    .filter((row) => row.length);

  let currRow = 0;

  const outputRows = newRows;

  while (filteredSegments.length) {
    const row = newRows[currRow] || [];
    let currRowPosition = 0;
    let ix = filteredSegments.length - 1;
    let startingIx = 0;

    // pass once to find out where the first segment to
    // intersect an existing segment is
    if (row.length > 0) {
      while (ix >= 0 && ix < filteredSegments[ix].length) {
        if (row[0].from <= filteredSegments[ix].from) {
          break;
        } else {
          ix++;
        }
      }
      startingIx = Math.min(ix, filteredSegments.length - 1);
    } else {
      // nothing in this row so we can safely start at index 0
      startingIx = 0;
    }

    for (const direction of [1, -1]) {
      ix = Math.min(startingIx, filteredSegments.length - 1);

      while (
        (direction === 1 && ix < filteredSegments.length) ||
        (direction === -1 &&
          ix >= 0 &&
          startingIx > 0 &&
          filteredSegments.length)
      ) {
        const seg = filteredSegments[ix];

        if (row.length === 0) {
          // row is empty, add the segment
          row.push(seg);
          filteredSegments.splice(ix, 1);
          ix += direction;
          continue;
        }

        let intersects = false;
        while (currRowPosition < row.length) {
          if (row[currRowPosition].from < seg.to + padding) {
            // this row starts before or within the segment
            if (seg.from - padding < row[currRowPosition].to) {
              // this row intersects the segment;
              intersects = true;
              break;
            } else {
              // it's before this segment
              currRowPosition++;
            }
          } else {
            // this row is after the current segment
            break;
          }
        }

        if (intersects) {
          if (direction === 1) {
            const newIx = segmentFromBisector(
              filteredSegments,
              row[currRowPosition].to + padding,
            );

            ix = newIx;
            continue;
          }
          ix += direction;
          continue;
        }

        if (currRowPosition >= row.length) {
          // we're past the last element in the row so we can
          // add this segment
          row.push(seg);
          filteredSegments.splice(ix, 1);
        } else if (seg.to + padding < row[currRowPosition].from) {
          // we have space to insert an element before
          // the next segment
          row.splice(currRowPosition, 0, seg);
          filteredSegments.splice(ix, 1);
        }

        ix += direction;
      }

      if (outputRows.length === currRow) {
        outputRows.push(row);
      } else {
        outputRows[currRow] = row;
      }
    }

    currRow += 1;
  }

  const t2 = currTime();
  // console.log('segmentsToRows', t2 - t1)
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

const renderSegments = (
  uid,
  tileIds,
  domain,
  scaleRange,
  position,
  dimensions,
  prevRows,
  trackOptions,
) => {
  const t1 = currTime();
  const allSegments = {};
  let allReadCounts = {};
  let maxReadCount = 0;

  for (const tileId of tileIds) {
    const tileValue = tileValues.get(`${uid}.${tileId}`);

    if (tileValue.error) {
      throw new Error(tileValue.error);
    }

    for (const segment of tileValue) {
      allSegments[segment.id] = segment;
    }

  }

  if(trackOptions.showReadCounts){
    const result = getReadCounts(allSegments);
    allReadCounts = result.readCounts;
    maxReadCount = result.maxReadCount;
  }
  //console.log(allSegments)

  const segmentList = Object.values(allSegments);

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

  // calculate the the rows of reads for each group
  for (let key of Object.keys(grouped)) {
    grouped[key].rows = segmentsToRows(grouped[key], {
      prevRows: (prevRows[key] && prevRows[key].rows) || [],
    });
  }

  // calculate the height of each group
  const totalRows = Object.values(grouped)
    .map((x) => x.rows.length)
    .reduce((a, b) => a + b, 0);
  let currStart = trackOptions.showReadCounts ? trackOptions.readCountHeight : 0;

  // const d = range(0, rows.length);
  const yGlobalScale = scaleBand()
    .domain(range(0, totalRows+currStart))
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

  if(trackOptions.showReadCounts){
    const d = range(0, trackOptions.readCountHeight);
    const groupStart = yGlobalScale(0);
    const groupEnd = yGlobalScale(trackOptions.readCountHeight-1) + yGlobalScale.bandwidth();
    const r = [groupStart, groupEnd];

    const yScale = scaleBand().domain(d).range(r).paddingInner(0.05);

    let xLeft, yTop, barHeight, bgColor;
    const width = xScale(1)-xScale(0);
    const groupHeight = yScale.bandwidth()*trackOptions.readCountHeight;
    const scalingFactor = groupHeight/maxReadCount;

    for (const pos of Object.keys(allReadCounts)) {
      xLeft= xScale(pos);
      yTop = groupHeight;

      // Draw rects for variants counts on top of each other
      for (const variant of Object.keys(allReadCounts[pos]['variants'])) {
        barHeight = allReadCounts[pos]['variants'][variant]*scalingFactor;
        yTop -= barHeight;
        addRect(xLeft, yTop, width, barHeight, PILEUP_COLOR_IXS[variant]);
      }

      barHeight = allReadCounts[pos]['matches']*scalingFactor;
      yTop -= barHeight;
      bgColor = pos % 2 === 0 ? PILEUP_COLOR_IXS.BG : PILEUP_COLOR_IXS.BG2;
      addRect(xLeft, yTop, width, barHeight, bgColor);
    }
  }

  for (const group of Object.values(grouped)) {
    const { rows } = group;

    const d = range(0, rows.length);
    const r = [group.start, group.end];

    const yScale = scaleBand().domain(d).range(r).paddingInner(0.2);

    let xLeft;
    let xRight;
    let yTop;
    let yBottom;

    rows.map((row, i) => {
      yTop = yScale(i);
      const height = yScale.bandwidth();
      yBottom = yTop + height;

      row.map((segment, j) => {
        const from = xScale(segment.from);
        const to = xScale(segment.to);

        xLeft = from;
        xRight = to;

        //console.log(xLeft, yTop, xRight - xLeft, height)
        if(segment.strand === '+' && trackOptions.plusStrandColor){
          addRect(xLeft, yTop, xRight - xLeft, height, PILEUP_COLOR_IXS.PLUS_STRAND);
        }
        else if(segment.strand === '-' && trackOptions.minusStrandColor){
          addRect(xLeft, yTop, xRight - xLeft, height, PILEUP_COLOR_IXS.MINUS_STRAND);
        }
        else{
          addRect(xLeft, yTop, xRight - xLeft, height, PILEUP_COLOR_IXS.BG);
        }
        //console.log(allColors)
        

        for (const substitution of segment.substitutions) {
          xLeft = xScale(segment.from + substitution.pos);
          const width = Math.max(1, xScale(substitution.length) - xScale(0));
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
            addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.I);
          } else if (substitution.type === 'D') {
            addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.D);

            // add some stripes
            const numStripes = 6;
            const stripeWidth = 0.1;
            for(let i = 0; i<=numStripes; i++){
              const xStripe = xLeft + i*width/numStripes
              addRect(xStripe, yTop, stripeWidth, height, PILEUP_COLOR_IXS.BLACK);
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

            let currPos = xLeft;
            const DASH_LENGTH = 6;
            const DASH_SPACE = 4;

            // draw dashes
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
              currPos += DASH_LENGTH + DASH_SPACE;
            }
            // allready handled above
          } else {
            addRect(xLeft, yTop, width, height, PILEUP_COLOR_IXS.BLACK);
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
    readCounts: allReadCounts,
    positionsBuffer,
    colorsBuffer,
    ixBuffer,
    xScaleDomain: domain,
    xScaleRange: scaleRange,
  };

  const t2 = currTime();
  // console.log('renderSegments:', t2 - t1);
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
};

expose(tileFunctions);
