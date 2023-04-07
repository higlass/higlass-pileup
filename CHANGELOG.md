v1.5.0

- Update dependencies

v1.4.1

- Fix alignment issue

v1.4.0

- When hovering over the coverage, the genomic range that is covered by the bar is now displayed
- Added the option `minMappingQuality` which takes an integer. If this is set, reads with a mapping quality lower than the specified value are not displayed.
- Added the option `outlineMateOnHover`
- Added the option `highlightReadsBy` which is an array can contain one or more of the value `insertSize`, `pairOrientation`, `insertSizeAndPairOrientation`. Details in the docs.

v1.3.1

- Added GitHub releases workflow
- Export PileupTrack as default

v1.3.0

- `maxTileWidth` option in the `data` section of the track that modifies the tile fetcher

v1.2.0

- Soft and hard clipped regions are now included in the calculation of an appropriate row for a read. Without that, clipped regions would often overlap with other reads
- New option `maxTileWidth` that controls when the "Zoom to see details" message is shown
- New option `collapseWhenMaxTileWidthReached`. When this is set, the track height will be set to 20 when `maxTileWidth` is reached. This can be useful when there are a lot of tracks and you want to zoom out. With this option the pileup track will only take minimal space as long as you are zoomed out, so that it is easier to look at the other tracks.
- Resolved some issues with a flickering "Zoom to see details" message.

v1.0.1

- Render BAM file tiles returned by resgen server

v1.0.0

- Added small example files to check non-standard reads (deletions, soft/hard clipping)
- Build out `es` modules when `npm run build` is executed
- Add option `workerScriptLocation`. This is needed when the worker script is not in the same folder as the pileup script
- The client side data fetcher now accepts `bamUrl` and `baiUrl`. `url` is still supported
- Added options `plusStrandColor` and `minusStrandColor`. When set, the reads are colored according to their strand.
- Added the option `showCoverage` and `coverageHeight`, which displays read coverage information on top of the track
- Improved mouseovers for reads and coverage
- Bumped version of GMOD/bam-js. New version allows to retrieve the read sequence
- Variants are now correctly colored based on the read sequence.
- Added visualization of reads that contain hard clipping
- Fixed a bug where MD strings would not be correctly parsed, when a deletion is present, e.g., `85^A16`
- Added vertical stripes to represent deletions.
- When there is soft clipping at the beginning of a read, substitutions that are following are now correctly extracted
- Reads have been shifted by one. It now lines up with the sequence track and the bam file

v0.4.0

- Added customizeable color scheme

v0.3.5

- Added label position options

v0.3.4

- Highlight reads on mouseOver
- Show nearest mismatch in mouseover popup
- Enabled the showMousePosition option

v0.2.2

- Implemented exportAsSvg

v0.2.1

- Column higlass server format
- Warning when zoomed out beyond `max_tile_width`

v0.2.0

- Support for higlass server-served tiles

v0.1.1

- Upgraded threads.js and added getThisScriptLocation so that the worker is pulled from the same location as the main script

v0.1.0

- First working version
