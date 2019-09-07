import { spawn, Worker } from 'threads';

/**
 * Get the location of this script so that we can use it to fetch
 * the worker script.
 *
 * @return {String}         The url of this script
 */
function getThisScriptLocation() {
  const scripts = [...document.getElementsByTagName('script')];
  for (const script of scripts) {
    const parts = script.src.split('/');

    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];

      if (lastPart.indexOf('higlass-pileup') >= 0) {
        return parts.slice(0, parts.length - 1).join('/');
      }
    }
  }
}

class BAMDataFetcher {
  constructor(dataConfig, HGC) {
    this.dataConfig = dataConfig;
    this.uid = HGC.libraries.slugid.nice();

    console.log('document.currentScript', document.currentScript.src);
    this.worker = spawn(
      new Worker(
        './bam-fetcher-worker.js',
      ),
    );

    this.initPromise = this.worker.then((tileFunctions) => {
      // console.log('tileFunctions:', tileFunctions);

      return tileFunctions.init(
        this.uid, dataConfig.url, dataConfig.chromSizesUrl,
      ).then(() => this.worker);
    });
  }

  tilesetInfo(callback) {
    // console.log('tsi');
    this.worker.then((tileFunctions) => {
      tileFunctions.tilesetInfo(this.uid).then(
        callback,
      );
    });
  }

  fetchTilesDebounced(receivedTiles, tileIds) {
    // console.log('ftd', tileIds);
    this.worker.then((tileFunctions) => {
      tileFunctions.fetchTilesDebounced(
        this.uid, tileIds,
      ).then(receivedTiles);
    });
  }
}

export default BAMDataFetcher;
