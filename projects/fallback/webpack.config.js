const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Bondage Club Tools',
    }),
  ],
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve( __dirname, '..', '..', 'dist')
  }
};
