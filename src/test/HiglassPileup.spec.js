import {
  configure,
  mount,
  // render,
  ReactWrapper,
} from 'enzyme';

import { HiGlassComponent, waitForTilesLoaded } from 'higlass';

import { expect } from 'chai';
import register from 'higlass-register';

import PileupTrack from '../src/scripts/PileupTrack';

register({
  name: 'PileupTrack',
  track: PileupTrack,
  config: PileupTrack.config,
});

export const getTrackObjectFromHGC = (hgc, viewUid, trackUid) =>
  hgc.tiledPlots[viewUid].trackRenderer.getTrackObject(trackUid);

import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

configure({ adapter: new Adapter() });

const viewConf = {
  editable: true,
  trackSourceServers: ['/api/v1', 'http://higlass.io/api/v1'],
  exportViewUrl: '/api/v1/viewconfs',
  views: [
    {
      initialXDomain: [133316.84212529, 134172.6944366717],
      initialYDomain: [-41978532.357771374, -41978262.53707586],
      tracks: {
        top: [
          {
            uid: 'AdlJsUYFRzuJRZyYeKDX2A',
            type: 'chromosome-labels',
            width: 904,
            height: 30,
            server: 'http://higlass.io/api/v1',
            options: {
              color: '#808080',
              stroke: '#ffffff',
              fontSize: 12,
              fontIsLeftAligned: false,
              showMousePosition: false,
              mousePositionColor: '#000000',
              reverseOrientation: false,
            },
            filetype: 'chromsizes-tsv',
            tilesetUid: 'NyITQvZsS_mOFNlz5C2LJg',
          },
          {
            uid: 'fastaex',
            data: {
              type: 'fasta',
              faiUrl:
                'https://aveit.s3.amazonaws.com/higlass/data/sequence/hg38.fa.fai',
              fastaUrl:
                'https://aveit.s3.amazonaws.com/higlass/data/sequence/hg38.fa',
              chromSizesUrl:
                'https://aveit.s3.amazonaws.com/higlass/data/sequence/hg38.mod.chrom.sizes',
            },
            type: 'horizontal-sequence',
            width: 904,
            height: 25,
            options: {
              name: 'hg38',
              barBorder: true,
              colorScale: [
                '#08519c',
                '#6baed6',
                '#993404',
                '#fe9929',
                '#808080',
                '#DCDCDC',
              ],
              labelColor: 'black',
              valueScaling: 'linear',
              labelPosition: 'topLeft',
              barBorderColor: 'white',
              backgroundColor: 'white',
              labelTextOpacity: 0.4,
              sortLargestOnTop: true,
              trackBorderColor: 'white',
              trackBorderWidth: 0,
              extendedPreloading: false,
              colorAggregationMode: 'none',
              notificationText: 'Zoom in to see nucleotides...',
              fontSize: 16,
              fontFamily: 'Arial',
              fontColor: 'white',
              textOption: {
                fontSize: '32px',
                fontFamily: 'Arial',
                fill: 16777215,
                fontWeight: 'bold',
              },
            },
          },
          {
            type: 'pileup',
            options: {
              axisPositionHorizontal: 'right',
              axisLabelFormatting: 'normal',
              outlineReadOnHover: 'yes',
              groupBy: 'strand',
              minusStrandColor: '#ffd1d4',
              plusStrandColor: '#cfd0ff',
              colorScale: [
                '#08519c',
                '#6baed6',
                '#993404',
                '#fe9929',
                '#808080',
                '#DCDCDC',
              ],
              showMousePosition: false,
              outlineMateOnHover: false,
              showCoverage: true,
              coverageHeight: 100,
              maxTileWidth: 200000,
              collapseWhenMaxTileWidthReached: false,
              minMappingQuality: 0,
              highlightReadsBy: [],
              largeInsertSizeThreshold: 1000,
              viewAsPairs: false,
            },
            height: 335,
            uid: 'pu1',
            data: {
              type: 'bam',
              bamUrl:
                'https://aveit.s3.amazonaws.com/higlass/bam/example_higlass.bam',
              baiUrl:
                'https://aveit.s3.amazonaws.com/higlass/bam/example_higlass.bam.bai',
              chromSizesUrl:
                'https://aveit.s3.amazonaws.com/higlass/data/sequence/hg38.mod.chrom.sizes',
            },
            width: 904,
          },
        ],
        left: [],
        center: [],
        bottom: [],
        right: [],
        whole: [],
        gallery: [],
      },
      layout: {
        w: 12,
        h: 6,
        x: 0,
        y: 0,
      },
      uid: 'WdlA7F8aTY2gXQzPGiBlwQ',
    },
  ],
  zoomLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
  locationLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
  valueScaleLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
};

describe('Test HiGlass Component', () => {
  let hgc = null;
  let div = null;

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 7000;
  describe('', () => {
    it('Cleans up previously created instances and mounts a new component', (done) => {
      if (hgc) {
        hgc.unmount();
        hgc.detach();
      }

      if (div) {
        global.document.body.removeChild(div);
      }

      div = global.document.createElement('div');
      global.document.body.appendChild(div);

      div.setAttribute(
        'style',
        'width:800px; height:800px; background-color: lightgreen',
      );
      div.setAttribute('id', 'simple-hg-component');

      hgc = mount(
        <HiGlassComponent options={{ bounded: false }} viewConfig={viewConf} />,
        { attachTo: div },
      );

      hgc.update();

      waitForTilesLoaded(hgc.instance(), done);
      // done();
    });

    it('Exports to SVG', (done) => {
      // console.log('exporting svg-----------------------------');
      hgc.instance().handleExportSVG();

      setTimeout(() => {
        hgc.instance().zoomTo('aa', 672764000, 672778000, 672764000, 672778000);
        hgc.instance().handleExportSVG();

        const trackObject = getTrackObjectFromHGC(hgc.instance(), 'aa', 'xx');
        const maxAndMin = trackObject.maxAndMin;

        expect(maxAndMin.min).to.be.above(0);
        done();
      }, 500);
    });
  });
});
