import { resolve as _resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const config = {
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
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'main.js',
    path: _resolve(import.meta.dirname, '..', '..', 'dist')
  }
};

export default config;
