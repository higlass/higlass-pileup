# Pileup Track

> Viewer for sequence alignments.

[![HiGlass](https://img.shields.io/badge/higlass-👍-red.svg?colorB=0f5d92)](http://higlass.io)
[![Build Status](https://img.shields.io/travis/higlass/higlass-pileup-track/master.svg?colorB=0f5d92)](https://travis-ci.org/higlass/higlass-pileup-track)

<img src="/teaser.png?raw=true" width="600" />

**Note**: This is the source code for the pileup only! You might want to check out the following repositories as well:

- HiGlass pileup track (this repository): https://github.com/higlass/higlass-pileup-track
- HiGlass viewer: https://github.com/higlass/higlass
- HiGlass server: https://github.com/higlass/higlass-server
- HiGlass docker: https://github.com/higlass/higlass-docker

## Installation

```
npm install higlass-pileup-track
```

## Usage

The live scripts can be found at:

- https://unpkg.com/higlass-pileup@v0.2.9/dist/higlass-pileup.min.js
- https://unpkg.com/higlass-pileup@v0.2.9/dist/0.higlass-pileup.min.worker.js

Note that `higlass-pileup` currently requires a worker thread. It'll automatically try to retrieve it from the same path as the main script but it needs to be hosted on the same server. The current recommended solution is to pull the already built js files from a release and have your web server serve them from the same path.

### Client

1. Make sure you load this track prior to `hglib.js`. For example:

```
<script src="higlass-pileup-track.js"></script>
<script src="hglib.js"></script>
<script>
  ...
</script>
```

2. Now, configure the track in your view config and be happy! 

```
{
  ...
    {
      "type": "pileup",
      "options": {
        "axisPositionHorizontal": "right",
        "axisLabelFormatting": "normal"
      },
      "height": 180,
      "uid": "FylkvVBTSumoJ959HT4-5A",
      "data": {
        "type": "bam",
        "url": "https://pkerp.s3.amazonaws.com/public/bamfile_test/SRR1770413.sorted.bam",
        "chromSizesUrl": "https://pkerp.s3.amazonaws.com/public/bamfile_test/GCF_000005845.2_ASM584v2_genomic.chrom.sizes"
      },
      "width": 470
    }
  ...
}
```

Take a look at [`src/index.html`](src/index.html) for an example.

## Development

### Installation

```bash
$ git clone https://github.com/higlass/higlass-pileup-track && higlass-pileup-track
$ npm install
```

### Commands

**Developmental server**: `npm start`
**Production build**: `npm run build`
