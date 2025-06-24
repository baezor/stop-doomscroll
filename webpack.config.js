const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: './src/content.ts',
    background: './src/background.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json',
          transform(content) {
            const manifest = JSON.parse(content.toString());
            // Update paths to remove 'dist/' prefix since everything will be in the same folder
            manifest.content_scripts[0].js = ['content.js'];
            manifest.content_scripts[0].css = ['content.css'];
            manifest.background.service_worker = 'background.js';
            // Add icons
            manifest.icons = {
              "16": "icon.svg",
              "48": "icon.svg", 
              "128": "icon.svg"
            };
            return JSON.stringify(manifest, null, 2);
          }
        },
        {
          from: 'icons/icon.svg',
          to: 'icon.svg'
        }
      ]
    }),
  ],
  optimization: {
    minimize: false
  }
};