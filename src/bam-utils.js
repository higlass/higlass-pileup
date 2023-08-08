export const PILEUP_COLORS = {
  BG: [0.89, 0.89, 0.89, 1], // gray for the read background
  BG2: [0.85, 0.85, 0.85, 1], // used as alternating color in the read counter band
  BG_MUTED: [0.92, 0.92, 0.92, 1], // coverage background, when it is not exact
  A: [0, 0, 1, 1], // blue for A
  C: [1, 0, 0, 1], // red for c
  G: [0, 1, 0, 1], // green for g
  T: [1, 1, 0, 1], // yellow for T
  S: [0, 0, 0, 0.4], // lighter grey for soft clipping
  H: [0, 0, 0, 0.5], // darker grey for hard clipping
  X: [0, 0, 0, 0.7], // black for unknown
  I: [1, 0, 1, 0.5], // purple for insertions
  D: [1, 0.5, 0.5, 0.5], // pink-ish for deletions
  N: [1, 1, 1, 1],
  LARGE_INSERT_SIZE: [1, 0, 0, 1], // Red for read pairs with large insert size
  SMALL_INSERT_SIZE: [0, 0.24, 0.48, 1], // Dark blue for read pairs with small insert size
  LL: [0.15, 0.75, 0.75, 1], // cyan for Left-Left reads (see https://software.broadinstitute.org/software/igv/interpreting_pair_orientations)
  RR: [0.18, 0.24, 0.8, 1], // darker blue for Right-Right reads
  RL: [0, 0.5, 0.02, 1], // darker green for Right-Left reads
  BLACK: [0, 0, 0, 1],
  BLACK_05: [0, 0, 0, 0.5],
  PLUS_STRAND: [0.75, 0.75, 1, 1],
  MINUS_STRAND: [1, 0.75, 0.75, 1],
  MM_M6A_FOR: [0.4, 0.2, 0.6, 1], // purple for m6A methylation events
  MM_M6A_REV: [0.4, 0.2, 0.6, 1], // purple for m6A methylation events
  MM_M5C_FOR: [1, 0, 0, 1], // red for CpG events
  MM_M5C_REV: [1, 0, 0, 1], // red for CpG events
  HIGHLIGHTS_CG: [0.95, 0.84, 0.84, 1], // CG highlights
  HIGHLIGHTS_A: [0.95, 0.84, 0.84, 1], // A highlights
  HIGHLIGHTS_T: [0.95, 0.84, 0.84, 1], // T highlights
  HIGHLIGHTS_G: [0.95, 0.84, 0.84, 1], // G highlights
  HIGHLIGHTS_C: [0.95, 0.84, 0.84, 1], // C highlights
  INDEX_DHS_BG: [0, 0, 0, 0],
};

export let PILEUP_COLOR_IXS = {};
Object.keys(PILEUP_COLORS).map((x, i) => {
  PILEUP_COLOR_IXS[x] = i;
  return null;
});

export function replaceColorIdxs(newColorIdxs) {
  PILEUP_COLOR_IXS = newColorIdxs;
}

export const indexDHSColors = (options) => {
  if (!options.indexDHS) return {};
  // console.log(`options ${JSON.stringify(options)}`);
  // console.log(`options.indexDHS.itemRGBMap ${JSON.stringify(options.indexDHS.itemRGBMap)}`);]
  const colorTable = {};
  colorTable['INDEX_DHS_BG'] = [0, 0, 0, 0], // Index DHS background default
  Object.entries(options.indexDHS.itemRGBMap).map((o) => {
    const k = o[0];
    // const v = o[1];
    const v = k.split(',').map(d => parseFloat((parseFloat(d)/255).toFixed(2)));
    colorTable[`INDEX_DHS_${k}`] = [...v, 1.0];
  });
  // console.log(`colorTable ${JSON.stringify(colorTable)}`);
  return {...PILEUP_COLORS, ...colorTable};
};

export const cigarTypeToText = (type) => {
  if (type === 'D') {
    return 'Deletion';
  } else if (type === 'S') {
    return 'Soft clipping';
  } else if (type === 'H') {
    return 'Hard clipping';
  } else if (type === 'I') {
    return 'Insertion';
  } else if (type === 'N') {
    return 'Skipped region';
  }

  return type;
};

export const parseMD = (mdString, useCounts) => {
  let currPos = 0;
  let currNum = 0;
  let deletionEncountered = false;
  let bamSeqShift = 0;
  const substitutions = [];

  for (let i = 0; i < mdString.length; i++) {
    if (mdString[i].match(/[0-9]/g)) {
      // a number, keep on going
      currNum = currNum * 10 + +mdString[i];
      deletionEncountered = false;
    } else if (mdString[i] === '^') {
      deletionEncountered = true;
    } else {
      currPos += currNum;

      if (useCounts) {
        substitutions.push({
          length: currNum,
          type: mdString[i],
        });
      } else if (deletionEncountered) {
        // Do nothing if there is a deletion and keep on going.
        // Note that there can be multiple deletions "^ATC"
        // Deletions are visualized using the CIGAR string
        // However, keep track of where in the bam seq we need to pull the variant.
        bamSeqShift -= 1;
      } else {
        substitutions.push({
          pos: currPos,
          base: mdString[i],
          length: 1,
          bamSeqShift,
        });
      }

      currNum = 0;
      currPos += 1;
    }
  }

  return substitutions;
};

/**
 * Builds an array of all methylations in the segment, represented
 * as offsets from the 5' end of the sequence, using data available
 * in the read's MM and ML tags
 * 
 * ref. https://samtools.github.io/hts-specs/SAMtags.pdf
 * 
 * @param  {String} segment  Current segment
 * @param  {String} seq   Read sequence from bam file.
 * @return {Array}  Methylation offsets.
 */
export const getMethylationOffsets = (segment, seq) => {
  let methylationOffsets = [];
  const moSkeleton = {
    "unmodifiedBase" : "",
    "code" : "",
    "strand" : "",
    "offsets" : [],
    "probabilities" : [],
  };
  
  const getAllIndexes = (arr, val) => {
    let indices = [], i;
    for (let i = 0; i < arr.length; ++i) {
      if (arr[i] === val) {
        indices.push(i);
      }
    }
    return indices;
  }

  // include IUPAC degeneracies, to follow SAM specification
  const complementOf = {
    'A' : 'T',
    'C' : 'G', 
    'G' : 'C', 
    'T' : 'A',
    'U' : 'A',
    'Y' : 'R',
    'R' : 'Y',
    'S' : 'S',
    'W' : 'W', 
    'K' : 'M',
    'M' : 'K',
    'B' : 'V',
    'V' : 'B',
    'D' : 'H',
    'H' : 'D',
    'N' : 'N',
  };
  // const reverseComplementString = (str) => str.split('').reduce((reversed, character) => complementOf[character] + reversed, '');
  // const reverseString = (str) => str.split('').reduce((reversed, character) => character + reversed, '');

  if (segment.mm && segment.ml) {
    let currentOffsetCount = 0;
    const baseModifications = segment.mm.split(';');
    const baseProbabilities = segment.ml.split(',');
    baseModifications.forEach((bm) => {
      if (bm.length === 0) return;
      const mo = Object.assign({}, moSkeleton);
      const elems = bm.split(',');
      mo.unmodifiedBase = elems[0].charAt(0);
      mo.strand = elems[0].charAt(1);
      mo.code = elems[0].charAt(2);
      const nOffsets = elems.length - 1;
      const offsets = new Array(nOffsets);
      const probabilities = new Array(nOffsets);
      const baseIndices = (segment.strand === '+') ? getAllIndexes(seq, mo.unmodifiedBase) : getAllIndexes(seq, complementOf[mo.unmodifiedBase]);

      //
      // build initial list of raw offsets
      //
      let offset = 0;
      if (segment.strand === '+') {
        for (let i = 1; i < elems.length; ++i) {
          const d = parseInt(elems[i]);
          offset += d;
          const strandedOffset = offset;
          const baseOffset = baseIndices[strandedOffset];
          const baseProbability = baseProbabilities[i - 1 + currentOffsetCount];
          offsets[i - 1] = baseOffset;
          probabilities[i - 1] = baseProbability;
          offset += 1;
        }
      }
      else {
        for (let i = 1; i < elems.length; ++i) {
          const d = parseInt(elems[i]);
          offset += d;
          const strandedOffset = baseIndices.length - offset - 1;
          const baseOffset = baseIndices[strandedOffset];
          const baseProbability = baseProbabilities[i - 1 + currentOffsetCount];
          offsets[nOffsets - i] = baseOffset; // reverse
          probabilities[nOffsets - i] = baseProbability;
          offset += 1;
        }
      }

      //
      // modify raw offsets with CIGAR/substitution data
      //
      let offsetIdx = 0;
      let offsetModifier = 0;
      let clipLength = 0;
      const modifiedOffsets = new Array();
      const modifiedProbabilities = new Array();

      for (const sub of segment.substitutions) {
        //
        // if the read starts or ends with soft or hard clipping
        //
        if ((sub.type === 'S') || (sub.type === 'H')) {
          offsetModifier -= sub.length;
          clipLength = sub.length;
        }
        //
        // walk through offsets and include those less than the current substitution position
        //
        else if ((sub.type === 'M') || (sub.type === '=')) {
          while ((offsets[offsetIdx] + offsetModifier) < (sub.pos + sub.length)) {
            if ((offsets[offsetIdx] + offsetModifier) >= sub.pos) {
              modifiedOffsets.push(offsets[offsetIdx] + offsetModifier - clipLength);
              modifiedProbabilities.push(probabilities[offsetIdx]);
            }
            offsetIdx++;
          }
        }
        //
        // filter out mismatches, else modify the offset padding
        //
        else if (sub.type === 'X') {
          if ((offsets[offsetIdx] + offsetModifier) === sub.pos) {
            offsetIdx++;
          }
        }
        //
        // handle substitution operations
        //
        else if (sub.type === 'D') {
          offsetModifier += sub.length;
        }
        else if (sub.type === 'I') {
          offsetModifier -= sub.length;
        }
        else if (sub.type === 'N') {
          offsetModifier += sub.length;
        }
        //
        // if the read ends with soft or hard clipping
        //
        if ((sub.type === 'S') || (sub.type === 'H')) {
          offsetModifier += sub.length;
        }
      };

      mo.offsets = modifiedOffsets;
      mo.probabilities = modifiedProbabilities;

      // if (mo.unmodifiedBase === 'A') {
      //   console.log(`segment.substitutions ${JSON.stringify(segment.substitutions, null, 2)}`); 
      //   console.log(`${JSON.stringify(actions)}`);
      // }
      
      methylationOffsets.push(mo);
      currentOffsetCount += nOffsets;
    });
  }

  return methylationOffsets;
}

/**
 * Gets an array of all substitutions in the segment
 * @param  {String} segment  Current segment
 * @param  {String} seq   Read sequence from bam file.
 * @return {Boolean} includeClippingOps  Include soft or hard clipping operations in substitutions output.
 */
export const getSubstitutions = (segment, seq, includeClippingOps) => {
  let substitutions = [];
  let softClippingAtReadStart = null;

  if (segment.cigar) {
    const cigarSubs = parseMD(segment.cigar, true);

    let currPos = 0;

    for (const sub of cigarSubs) {
      if (includeClippingOps && ((sub.type === 'S') || (sub.type === 'H'))) {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: sub.type,
        });
        currPos += sub.length;
      }
      else if (sub.type === 'X') {
        // sequence mismatch, no need to do anything
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: 'X',
        });
        currPos += sub.length;
      } 
      else if (sub.type === 'I') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: 'I',
        });
        // currPos -= sub.length;
      } 
      else if (sub.type === 'D') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: 'D',
        });
        currPos += sub.length;
      } 
      else if (sub.type === 'N') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: 'N',
        });
        currPos += sub.length;
      } 
      else if (sub.type === '=') { 
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: '=',
        });
        currPos += sub.length;
      } 
      else if (sub.type === 'M') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          range: [currPos + segment.start, currPos + segment.start + sub.length],
          type: 'M',
        });
        currPos += sub.length;
      }
      else {
        // console.log('skipping:', sub.type);
      }
    }

    const firstSub = cigarSubs[0];
    const lastSub = cigarSubs[cigarSubs.length - 1];

    // Soft clipping can happen at the beginning, at the end or both
    // positions are from the beginning of the read
    if (firstSub.type === 'S') {
      softClippingAtReadStart = firstSub;
      // soft clipping at the beginning
      substitutions.push({
        pos: -firstSub.length,
        type: 'S',
        length: firstSub.length,
      });
    }
    // soft clipping at the end
    if (lastSub.type === 'S') {
      substitutions.push({
        pos: segment.to - segment.from,
        length: lastSub.length,
        type: 'S',
      });
    }

    // Hard clipping can happen at the beginning, at the end or both
    // positions are from the beginning of the read
    if (firstSub.type === 'H') {
      substitutions.push({
        pos: -firstSub.length,
        type: 'H',
        length: firstSub.length,
      });
    }
    if (lastSub.type === 'H') {
      substitutions.push({
        pos: segment.to - segment.from,
        length: lastSub.length,
        type: 'H',
      });
    }
  }

  if (segment.md) {
    const mdSubstitutions = parseMD(segment.md, false);

    mdSubstitutions.forEach(function (substitution) {
      let posStart = substitution['pos'] + substitution['bamSeqShift'];
      let posEnd = posStart + substitution['length'];
      // When there is soft clipping at the beginning,
      // we need to shift the position where we read the variant from the sequence
      // not necessary when there is hard clipping
      if (softClippingAtReadStart !== null) {
        posStart += softClippingAtReadStart.length;
        posEnd += softClippingAtReadStart.length;
      }
      substitution['variant'] = seq.substring(posStart, posEnd);
      delete substitution['bamSeqShift'];
    });

    substitutions = mdSubstitutions.concat(substitutions);
  }

  return substitutions;
};

/**
 * Checks the track options and determines if mates need to be loaded
 */
export const areMatesRequired = (trackOptions) => {
  return (
    trackOptions.highlightReadsBy.length > 0 ||
    trackOptions.outlineMateOnHover
  );
};

/**
 * Calculates insert size between read segements
 */
 export const calculateInsertSize = (segment1, segment2) => {
  return segment1.from < segment2.from
    ? Math.max(0, segment2.from - segment1.to)
    : Math.max(0, segment1.from - segment2.to);
};
