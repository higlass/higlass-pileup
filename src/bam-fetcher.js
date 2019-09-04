import { spawn, Worker } from 'threads';


class BAMDataFetcher {
  constructor(dataConfig, HGC) {
    this.dataConfig = dataConfig;
    this.uid = HGC.libraries.slugid.nice();

    this.worker = spawn(
      new Worker('./bam-fetcher-worker.js'),
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
