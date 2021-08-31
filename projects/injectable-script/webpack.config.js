const path = require('path');

module.exports = {
  devtool: 'inline-source-map',
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
    path: path.resolve( __dirname, '..', '..', 'dist', 'bclub-tools', 'injectable-script'),
    libraryTarget: 'var',
    library: 'BondageClubTools'
  }
};
