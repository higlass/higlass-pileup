class BAMDataFetcher {
  constructor(dataConfig, worker, HGC) {
    this.dataConfig = dataConfig;
    this.uid = HGC.libraries.slugid.nice();
    this.worker = worker;
    this.isServerFetcher = !(dataConfig.type && dataConfig.type === 'bam');

    this.initPromise = this.worker.then(tileFunctions => {
      if (this.isServerFetcher) {
        return tileFunctions
          .serverInit(
            this.uid,
            dataConfig.server,
            dataConfig.tilesetUid,
            HGC.services.authHeader
          )
          .then(() => this.worker);
      }
      return tileFunctions
        .init(this.uid, dataConfig.url, dataConfig.chromSizesUrl)
        .then(() => this.worker);
    });
  }

  tilesetInfo(callback) {
    this.worker.then(tileFunctions => {
      if (this.isServerFetcher) {
        tileFunctions.serverTilesetInfo(this.uid).then(callback);
      } else {
        tileFunctions.tilesetInfo(this.uid).then(callback);
      }
    });
  }

  fetchTilesDebounced(receivedTiles, tileIds) {
    this.track.loadingText.text = 'Loading...';
    this.track.loadingText.visible = true;

    this.worker.then(tileFunctions => {
      if (this.isServerFetcher) {
        tileFunctions
          .serverFetchTilesDebounced(this.uid, tileIds)
          .then(receivedTiles);
      } else {
        tileFunctions
          .fetchTilesDebounced(this.uid, tileIds)
          .then(receivedTiles);
      }
    });
  }
}

export default BAMDataFetcher;
