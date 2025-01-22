import register from 'higlass-register';

import PileupTrack from './PileupTrack';

register({
  name: 'PileupTrack',
  track: PileupTrack,
  config: PileupTrack.config,
}, {
  force: true,
});

export default PileupTrack;
