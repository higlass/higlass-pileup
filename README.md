# HiGlass Pileup Track

> Viewer for sequence alignments.

[![HiGlass](https://img.shields.io/badge/higlass-👍-red.svg?colorB=0f5d92)](http://higlass.io)
[![Build Status](https://img.shields.io/travis/higlass/higlass-pileup-track/master.svg?colorB=0f5d92)](https://travis-ci.org/higlass/higlass-pileup-track)

<img src="/teaser.png?raw=true" width="600" />

**Note**: This is the source code for the pileup only! You might want to check out the following repositories as well:

- HiGlass viewer: https://github.com/higlass/higlass
- HiGlass server: https://github.com/higlass/higlass-server
- HiGlass docker: https://github.com/higlass/higlass-docker

## Installation

```
npm install higlass-pileup
```

## Usage

The live scripts can be found at:

- https://unpkg.com/higlass-pileup/dist/higlass-pileup.min.js

### Client

1. Make sure you load this track prior to `hglib.js`. For example:

```
<script src="/higlass-pileup-track.js"></script>
<script src="hglib.js"></script>
<script>
  ...
</script>
```

2. Now, configure the track in your view config and be happy!

```
{
  "editable": true,
  "trackSourceServers": [
    "http://higlass.io/api/v1"
  ],
  "exportViewUrl": "/api/v1/viewconfs",
  "views": [
    {
      "initialXDomain": [
        0,
        100000
      ],
      "tracks": {
        "top": [
          {
            "type": "pileup",
            "options": {
              "axisPositionHorizontal": "right",
              "axisLabelFormatting": "normal",
              "showCoverage": false,
              "colorScale": [
                // A T G C N Other
                "#2c7bb6",
                "#92c5de",
                "#ffffbf",
                "#fdae61",
                "#808080",
                "#DCDCDC"
              ]
            },
            "height": 180,
            "uid": "FylkvVBTSumoJ959HT4-5A",
            "data": {
              "type": "bam",
              "url": "https://pkerp.s3.amazonaws.com/public/bamfile_test/SRR1770413.sorted.bam",
              "chromSizesUrl": "https://pkerp.s3.amazonaws.com/public/bamfile_test/GCF_000005845.2_ASM584v2_genomic.chrom.sizes",
              {
                "options": {
                  "maxTileWidth": 30000
                }
              }
            },
            "width": 470
          }
        ]
      },
      "layout": {
        "w": 12,
        "h": 6,
        "x": 0,
        "y": 0
      }
    }
  ]
}
```

3. To use in higlass.io:

- Modify the viewconf above to specify the URL for your BAM file.
- Either remove or update the `chromSizesUrl` entry to point to a chromosome sizes file for the assembly that your BAM file is aligned to. If it's omitted, the chromosome sizes will be extracted directly from the BAM file and ordered best-guess semantically (i.e. chr1, chr2, ...., chrM, chrX, chrY).
- Save the viewconf as a JSON file.
- Navigate to higlass.io/app and drag the JSON file onto the viewer.
- Browse away!

## Options

### Data config

**maxTileWidth** - To limit the amount of data that is fetched from the server, HiGlass sets a
default maximum tile width. This can be modified in the `data` section of the track config. Setting
it to a large file will let you zoom out further while still fetching data. This is useful for
viewing low coverage BAM files.

### Track options

**colorScale** - Array that controls the color of substitutions and highlighed reads. It can take 6 or 11 values. 11 values are required if you want to control highlighted read colors (see the `highlightReadsBy` option). Example:
```
"colorScale": [
  "#2c7bb6", //color of A substitutions
  "#92c5de", //color of T substitutions
  "#ffffbf", //color of G substitutions
  "#fdae61", //color of C substitutions
  "#808080", //color of N substitutions
  "#DCDCDC", //color of other substitutions
  "#FF0000", //color of reads with large insert size
  "#0000D1", //color of reads with small insert size
  "#00D1D1", //color of reads with LL orientation (see https://software.broadinstitute.org/software/igv/interpreting_pair_orientations)
  "#555CFA", //color of reads with RR orientation 
  "#02A221", //color of reads with RL orientation 
]
```

**outlineReadOnHover** - Highlights the current read on hover.

**outlineMateOnHover** - Highlights the mate of the current read on hover. If the mate is a split read, 
both alignments will be highlighted.

**highlightReadsBy** - Array that can take the values `insertSize`, `pairOrientation` or `insertSizeAndPairOrientation`:
- if `insertSize` is set, reads that have a large or small insert size will be highlighted. The thresholds are controlled by the `largeInsertSizeThreshold` and `smallInsertSizeThreshold` track options. `largeInsertSizeThreshold` defaults to `1000`, i.e., 1000 bp. `smallInsertSizeThreshold` is not set by default, i.e, reads with small insert size won't be highlighted.
- if `pairOrientation` is set, reads with an abnormal mapping orientation are highlighted (e.g. ++,--,-+).
- if `insertSizeAndPairOrientation` is set, reads with an abnormal mapping orientation that also have abnormal insert sizes are highlighted.
- if multiple values are set, reads that fulfill any of the conditions are highlighed in the corresponding color.
- highlight colors can be controlled by extending the `colorScale` track option to 11 values. The additional 5 values will control the large insert size color, small insert size color and the ++, --, -+ mapping orientations (in that order).

**minMappingQuality** - If this is set (integer), reads with a mapping quality lower than the specified value are not displayed.

## Support

For questions, please either open an issue or ask on the HiGlass Slack channel at http://bit.ly/higlass-slack

## Development

### Installation

```bash
$ git clone https://github.com/higlass/higlass-pileup-track && higlass-pileup-track
$ npm install
```

### Commands

**Developmental server**: `npm start`
**Production build**: `npm run build`
