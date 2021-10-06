import register from 'higlass-register';

import PileupTrack from './PileupTrack';

register({
  name: 'PileupTrack',
  track: PileupTrack,
  config: PileupTrack.config,
});

export default PileupTrack;
