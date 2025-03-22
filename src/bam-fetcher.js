const DEBOUNCE_TIME = 200;

class BAMDataFetcher {
  constructor(dataConfig, trackOptions, worker, HGC) {
    this.dataConfig = dataConfig;
    this.uid = HGC.libraries.slugid.nice();

    this.worker = worker;

    if (dataConfig.type === 'local-tiles') {
      this.fetcherType = 'local-tiles';
    } else if (dataConfig.type === 'bam') {
      this.fetcherType = 'bam';
    } else {
      this.fetcherType = 'server';
    }

    this.prevRequestTime = 0;

    this.toFetch = new Set();
    this.fetchTimeout = null;

    this.initPromise = this.worker.then((tileFunctions) => {
      if (this.fetcherType === 'server') {
        return tileFunctions
          .serverInit(
            this.uid,
            dataConfig.server,
            dataConfig.tilesetUid,
            HGC.services.authHeader,
          )
          .then(() => this.worker);
      }

      if (this.fetcherType === 'local-tiles') {
        // If we have a local tile fetcher, we need to register that with the worker
        return tileFunctions
          .localInit(this.uid, dataConfig.tilesetInfo, dataConfig.tiles)
          .then(() => this.worker);
      }

      if (dataConfig.url && !dataConfig.bamUrl) {
        dataConfig['bamUrl'] = dataConfig.url;
      }
      if (!dataConfig.baiUrl) {
        dataConfig['baiUrl'] = dataConfig['bamUrl'] + '.bai';
      }

      return tileFunctions
        .init(
          this.uid,
          dataConfig.bamUrl,
          dataConfig.baiUrl,
          dataConfig.chromSizesUrl,
          dataConfig.options,
          trackOptions,
        )
        .then(() => this.worker);
    });
  }

  tilesetInfo(callback) {
    this.worker.then((tileFunctions) => {
      if (this.fetcherType === 'server') {
        tileFunctions.serverTilesetInfo(this.uid).then(callback);
      } else if (this.fetcherType === 'bam') {
        tileFunctions.tilesetInfo(this.uid).then(callback);
      } else if (this.fetcherType === 'local-tiles') {
        tileFunctions.localTilesetInfo(this.uid).then(callback);
      }
    });
  }

  fetchTilesDebounced(receivedTiles, tileIds) {
    const { toFetch } = this;

    const thisZoomLevel = tileIds[0].split('.')[0];
    const toFetchZoomLevel = toFetch.size
      ? [...toFetch][0].split('.')[0]
      : null;

    if (thisZoomLevel !== toFetchZoomLevel) {
      for (const tileId of this.toFetch) {
        this.track.fetching.delete(tileId);
      }
      this.toFetch.clear();
    }

    tileIds.forEach((x) => this.toFetch.add(x));

    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
    }

    this.fetchTimeout = setTimeout(() => {
      this.sendFetch(receivedTiles, [...this.toFetch]);
      this.toFetch.clear();
    }, DEBOUNCE_TIME);
  }

  sendFetch(receivedTiles, tileIds) {
    this.track.updateLoadingText();

    this.worker.then((tileFunctions) => {
      if (this.fetcherType === 'server') {
        tileFunctions
          .serverFetchTilesDebounced(this.uid, tileIds)
          .then(receivedTiles);
      } else if (this.fetcherType === 'local-tiles') {
        tileFunctions
          .localFetchTilesDebounced(this.uid, tileIds)
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
