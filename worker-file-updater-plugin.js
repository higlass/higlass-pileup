/**
 * Replaces calls such as:
 *    new Worker('./my/filename-worker.js')
 * with:
 *    new Worker('filename-worker.453650986fac3256.js')
 * According to the final chunk name of your worker file.
 *
 * Assumes:
 *  - You name your worker files *-worker.js|ts|jsx|tsx
 *    (this is needed, as the Worker class-name isn't taken into account when searching)
 *  - You have distinct names for worker files (their paths are ignored)
 *  - Your Webpack config has a chunk ("entry:") for your worker, with the same name as the worker
 *  - Your Webpack config doesn't externalize the runtime for worker chunks (optimization.runtimeChunk isn't 'single') -
 *    otherwise, regardless of this plugin, your worker won't work.
 */
module.exports = class WorkerFileUpdaterPlugin {

  // Catch "filename.possiblehexhash.possiblesuffix.js"
  static c_outputJsRegex = /^([a-zA-Z0-9_\-]+)(?:\.[a-zA-Z0-9_\-]+)*\.(jsx?|tsx?)$/;

  // Catch "new SomeWorkerClass('//../ignored/path/to/filename-worker.js'", allowing further args
  _workerRegex = /new ((?:[a-zA-Z_][a-zA-Z0-9_]*\.)*(?:[a-zA-Z_][a-zA-Z0-9_]*))\(\s*(['"])(?:[a-zA-Z0-9_\-.~]*\/)*([a-zA-Z0-9_\-]+-worker\.(?:jsx?|tsx?))\2/g

  apply(compiler) {
    const pluginName = this.constructor.name;

    const webpack = compiler.webpack;

    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      const processAssetsOpts = {
        name: pluginName,
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        additionalAssets: false // Call me once with all-assets-so-far, ignore newly emitted assets
      };

      compilation.hooks.processAssets.tap(processAssetsOpts, assets => {
        const barenameToAssetname = this.mapNames(assets);

        for (const assetname of barenameToAssetname.values()) {
          compilation.updateAsset(
            assetname,
            assetObject => new webpack.sources.RawSource(
              this.transform(assetObject.source(), barenameToAssetname)));
        }
      });
    });
  }

  mapNames(assets) {
    const proto = Object.getPrototypeOf(assets);

    const map = new Map();
    for (const assetname in assets) {
      if (proto !== null && !assets.hasOwnProperty(assetname)) {
        continue;
      }

      const matchArr = assetname.match(this.constructor.c_outputJsRegex);
      if (matchArr === null) {
        continue;
      }

      const [_match, filename, extension] = matchArr;
      const barename = `${filename}.${extension}`;
      map.set(barename, assetname);
    }

    return map;
  }

  transform(sourceText, barenameToAssetname) {
    return sourceText.replace(this._workerRegex, (match, workerClassCapture, quoteCapture, barenameCapture) => {
      const assetname = barenameToAssetname.get(barenameCapture);
      if (assetname === undefined) {
        return match;
      }

      return `new ${workerClassCapture}(${quoteCapture}${assetname}${quoteCapture}`
    });
  }
};

