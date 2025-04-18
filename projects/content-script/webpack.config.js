import { resolve as _resolve } from 'path';

const mainConfig = {
  entry: {
    main: './src/main.ts'
  },
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
    filename: '[name].js',
    path: _resolve(import.meta.dirname, '..', '..', 'dist', 'content-script')
  }
};

const hooksConfig = {
  entry: {
    hooks: './src/hooks.ts'
  },
  devtool: 'inline-source-map',
  experiments: {
    outputModule: true,
  },
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
    filename: '[name].js',
    path: _resolve(import.meta.dirname, '..', '..', 'dist', 'content-script'),
    library: {
      type: 'module'
    }
  }
};

export default [mainConfig, hooksConfig];
