export const PILEUP_COLORS = {
  BG: [0.8, 0.8, 0.8, 1],  // gray for the read background
  A: [0, 0, 1, 1], // blue for A
  C: [1, 0, 0, 1], // red for c
  G: [0, 1, 0, 1], // green for g
  T: [1, 1, 0, 1], // yellow for T
  S: [0, 1, 1, 0.5], // cyan for soft-clipping
  X: [0, 0, 0, 0.7], // black for unknown
  I: [1, 0, 1, 0.5], // purple for insertions
  D: [1, 0.5, 0.5, 0.5], // pink-ish for deletions
  N: [1, 1, 1, 1],
  BLACK: [0,0,0,1],
  BLACK_05: [0,0,0,0.5]
};

export const PILEUP_COLOR_IXS = {};
Object.keys(PILEUP_COLORS).map((x,i) => PILEUP_COLOR_IXS[x] = i);

export const parseMD = (mdString, useCounts, subStorage) => {
  let currPos = 1;
  let currNum = 0
  let lettersBefore = [];
  const substitutions = [];

  for (let i = 0; i < mdString.length; i++) {
    if (mdString[i].match(/[0-9]/g)) {
      // a number, keep on going
      currNum = currNum * 10 + +mdString[i];
    } else {
      currPos += currNum;

      if (useCounts) {
        substitutions.push({
          length: currNum,
          type: mdString[i],
        });
      } else {
        substitutions.push({
          pos: currPos,
          base: mdString[i + 0],
          length: 1,
        });
      }

      currNum = 0;
      currPos += 1;
    }
  }

  return substitutions;
};

export const getSubstitutions = segment => {
  let substitutions = [];
  let insertions = 0;

  if (segment.md) {
    substitutions = parseMD(segment.md);
  }

  if (segment.cigar) {
    const cigarSubs = parseMD(segment.cigar, true);

    // console.log('cigarSubs', cigarSubs);

    let currPos = 0;

    for (const sub of cigarSubs) {
      if (sub.type === 'X') {
        // sequence mismatch, no need to do anything
        substitutions.push({
          pos: currPos,
          length: sub.length,
          sub,
          type: 'X',
        });

        currPos += sub.length;
      } else if (sub.type === 'I') {
        insertions += 1;
        substitutions.push({
          pos: currPos,
          length: 0.1,
          sub,
          type: 'I',
        });
      } else if (sub.type === 'D') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          sub,
          type: 'D',
        });
        currPos += sub.length;
      } else if (sub.type === 'N') {
        substitutions.push({
          pos: currPos,
          length: sub.length,
          sub,
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

    // positions are from the beginning of the read
    if (firstSub.type === 'S') {
      // soft clipping at the beginning
      substitutions.push({
        pos: -firstSub.length + 1,
        type: 'S',
        sub: firstSub,
        length: firstSub.length,
      });
    } else if (lastSub.type === 'S') {
      // soft clipping at the end
      substitutions.push({
        pos: segment.to - segment.from + 1,
        length: lastSub.length,
        sub: lastSub,
        type: 'S',
      });
    }
  }

  return substitutions;
};
