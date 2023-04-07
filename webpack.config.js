const path = require('path');

const HtmlWebPackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
const ThreadsPlugin = require('threads-plugin');
const WebpackBeforeBuildPlugin = require('before-build-webpack');
const fs = require('fs');

// the WaitPlugin is copypasta from:
// https://www.viget.com/articles/run-multiple-webpack-configs-sequentially/
class WaitPlugin extends WebpackBeforeBuildPlugin {
  constructor(file, interval = 100, timeout = 10000) {
    super(function (stats, callback) {
      let start = Date.now();

      function poll() {
        if (fs.existsSync(file)) {
          callback();
        } else if (Date.now() - start > timeout) {
          throw Error(
            `Waited too long for the target file (${file}) to be generated. Exiting.`,
          );
        } else {
          setTimeout(poll, interval);
        }
      }

      poll();
    });
  }
}

const workerConfig = {
  output: {
    filename: 'worker.js',
    path: path.resolve(__dirname, 'dist'),
  },
  entry: path.resolve(__dirname, 'src/bam-fetcher-worker'),
  target: 'webworker',
  plugins: [new UnminifiedWebpackPlugin(), new ThreadsPlugin()],
};

const libraryConfig = {
  output: {
    filename: 'higlass-pileup.min.js',
    library: 'higlass-pileup',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: [path.join(__dirname, 'node_modules/higlass/dist')],
    watchContentBase: true,
    writeToDisk: true,
  },
  optimization: {
    minimizer: [
      new TerserPlugin()
    ],
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'index',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  module: {
    rules: [
      // Run ESLint first
      /*
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
        },
      },
      */
      // Transpile the ESD6 files to ES5
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      // Extract them HTML files
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: true },
          },
        ],
      },
      {
        test: /.*\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/index.html',
      filename: './index.html',
    }),
    new UnminifiedWebpackPlugin(),
    new ThreadsPlugin(),
    new WaitPlugin('dist/worker.js'),
  ],
};

module.exports = [workerConfig, libraryConfig];
