const DEBOUNCE_TIME = 200;

class BAMDataFetcher {
  constructor(dataConfig, worker, HGC) {
    this.dataConfig = dataConfig;
    this.uid = HGC.libraries.slugid.nice();
    this.worker = worker;
    this.isServerFetcher = !(dataConfig.type && dataConfig.type === 'bam');
    this.prevRequestTime = 0;

    this.toFetch = new Set();
    this.fetchTimeout = null;

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

      if(dataConfig.url && !dataConfig.bamUrl){
        dataConfig["bamUrl"] = dataConfig.url;
      }
      if(!dataConfig.baiUrl){
        dataConfig["baiUrl"] = dataConfig["bamUrl"]+".bai";
      }

      return tileFunctions
        .init(this.uid, dataConfig.bamUrl, dataConfig.baiUrl, dataConfig.chromSizesUrl)
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
    const { toFetch  } = this;

    const thisZoomLevel = tileIds[0].split('.')[0];
    const toFetchZoomLevel = toFetch.size ? [...toFetch][0].split('.')[0] : null;

    if (thisZoomLevel !== toFetchZoomLevel) {
      for (const tileId of this.toFetch) {
        this.track.fetching.delete(tileId);
      }
      this.toFetch.clear();
    }

    tileIds.forEach(x => this.toFetch.add(x)) ;

    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout)
    }

    this.fetchTimeout = setTimeout(() => {
      this.sendFetch(receivedTiles, [...this.toFetch])
      this.toFetch.clear()
    }, DEBOUNCE_TIME)
  }

  sendFetch(receivedTiles, tileIds) {
    this.track.updateLoadingText();

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
