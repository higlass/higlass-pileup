import register from 'higlass-register';

import { BasicMultipleLineChart, StackedBarTrack } from 'higlass-multivec';
import Arcs1DTrack from 'higlass-arcs';
import { TranscriptsTrack } from 'higlass-transcripts';

import PileupTrack from './PileupTrack';

register({
  name: 'PileupTrack',
  track: PileupTrack,
  config: PileupTrack.config,
});

register({
  name: 'BasicMultipleLineChart',
  track: BasicMultipleLineChart,
  config: BasicMultipleLineChart.config,
});

register({
  name: 'StackedBarTrack',
  track: StackedBarTrack,
  config: StackedBarTrack.config,
});

register({
  name: 'Arcs1DTrack',
  track: Arcs1DTrack,
  config: Arcs1DTrack.config,
});

register({
  name: 'TranscriptsTrack',
  track: TranscriptsTrack,
  config: TranscriptsTrack.config,
});
