export const PILEUP_COLORS = {
  BG: [0.89, 0.89, 0.89, 1], // gray for the read background
  BG2: [0.85, 0.85, 0.85, 1], // used as alternating color in the read counter band
  BG_MUTED: [0.92, 0.92, 0.92, 1], // covergae background, when it is not exact
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
};

export const PILEUP_COLOR_IXS = {};
Object.keys(PILEUP_COLORS).map((x, i) => {
  PILEUP_COLOR_IXS[x] = i;

  return null;
});

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

export const posToChrPos = (pos, chromsizes) => {
  // Convert an absolute genomic position to a chromosome
  // position. The chromsizes array should be an array of [chrom, size]
  // tuples

  // assume the position is 1-based

  for (let i = 0; i < chromsizes.length; i++) {
    if (pos <= chromsizes[i][1]) {
      return [chromsizes[i][0], pos];
    }

    pos -= chromsizes[i][1];
  }

  throw new Error('Position extends beyond chromsizes');
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
 * Gets an array of all substitutions in the segment
 * @param  {String} segment  Current segment
 * @param  {String} seq   Read sequence from bam file.
 * @return {Array}  Substitutions.
 */
export const getSubstitutions = (segment, seq) => {
  let substitutions = [];
  let softClippingAtReadStart = null;

  if (segment.cigar) {
    const cigarSubs = parseMD(segment.cigar, true);

    let currPos = 0;

    for (const sub of cigarSubs) {
      if (sub.type === 'X') {
        // sequence mismatch, no need to do anything
        substitutions.push({
          pos: currPos,
          length: sub.length,
          type: 'X',
        });

        currPos += sub.length;
      } else if (sub.type === 'I') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          type: 'I',
        });
      } else if (sub.type === 'D') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          type: 'D',
        });
        currPos += sub.length;
      } else if (sub.type === 'N') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          type: 'N',
        });
        currPos += sub.length;
      } else if (sub.type === '=' || sub.type === 'M') {
        currPos += sub.length;
      } else {
        // console.log('skipping:', sub.type);
      }
      // if (referenceConsuming.has(sub.base)) {
      //   if (queryConsuming.has(sub.base)) {
      //     substitutions.push(
      //     {
      //       pos:
      //     })
      //   }
      // }
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
    trackOptions.outlineMateOnHover ||
    trackOptions.viewAsPairs
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
