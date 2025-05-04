const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none', // This leaves the source code as close as possible to the original (when packaging we set this to 'production')
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // The vscode-module is created on-the-fly and must be excluded
  },
  optimization: {
    minimize: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
    // Make sure webpack resolves the @tml/parser package from the local workspace
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules')
    ],
    alias: {
      '@tml/parser': path.resolve(__dirname, '../tml-parser/dist')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules\/(?!@tml\/parser)/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  }
};
