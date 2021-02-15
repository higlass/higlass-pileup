const path = require('path');

const autoprefixer = require('autoprefixer');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
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
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
      }),
      new OptimizeCssAssetsPlugin({}),
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
      // Convert SASS to CSS, postprocess it, and bundle it
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              minimize: { safe: true },
              url: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                autoprefixer({
                  browsers: [
                    '>1%',
                    'last 4 versions',
                    'Firefox ESR',
                    'not ie < 9',
                  ],
                  flexbox: 'no-2009',
                }),
              ],
            },
          },
          'sass-loader', // compiles Sass to CSS
        ],
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
