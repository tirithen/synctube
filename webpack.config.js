const WebpackNotifierPlugin = require('webpack-notifier');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './client/index.js'
  },
  output: {
    path: `${__dirname}/build/`,
    filename: 'script.js'
  },
  devtool: 'cheap-source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0']
        }
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader!autoprefixer-loader'
      }
    ]
  },
  plugins: [
    new WebpackNotifierPlugin(),
    new HtmlWebpackPlugin({
      title: 'Synctube',
      filename: './index.html',
      template: './client/index.html',
      inject: 'body'
    })
  ]
};
