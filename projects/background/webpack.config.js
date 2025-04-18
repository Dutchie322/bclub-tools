import { resolve as _resolve } from 'path';

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
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'main.js',
    path: _resolve(import.meta.dirname, '..', '..', 'dist', 'background')
  }
};

export default config;
