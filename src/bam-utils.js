export const parseMD = (mdString, useCounts) => {
  let currPos = 1;
  let lettersBefore = [];
  const substitutions = [];

  for (let i = 0; i < mdString.length; i++) {
    if (mdString[i].match(/[0-9]/g)) {
      // a number, keep on going
      lettersBefore.push(mdString[i]);
    } else {
      if (lettersBefore.length) {
        currPos += +lettersBefore.join('');
      }

      if (useCounts) {
        substitutions.push({
          length: +lettersBefore.join(''),
          type: mdString[i],
        });
      } else {
        substitutions.push({
          pos: currPos,
          base: mdString[i + 0],
          length: 1,
        });
      }

      lettersBefore = [];
      currPos += 1;
    }
  }

  return substitutions;
};

export const getSubstitutions = segment => {
  let substitutions = [];
  let insertions = 0;
  let insertions10 = 0;

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
        if (sub.length > 10) {
          insertions10 += 1;
        }
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
