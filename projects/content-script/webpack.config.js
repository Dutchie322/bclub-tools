const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

var config = {
  entry: './src/main.ts',
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
    extensions: [ '.ts', '.js' ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve( __dirname, '..', '..', 'dist', 'bclub-tools', 'content-script')
  }
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'inline-source-map';
  }

  if (argv.mode === 'production') {
    config.optimization = {
      minimizer: [
        // new TerserPlugin({
        //   terserOptions: {
        //     output: {
        //       comments: /@preserve/i,
        //     },
        //   },
        //   extractComments: true
        // })
      ],
    };
  }

  return config;
};
