const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: [
    './src/index.js',
  ],
  output: {
    filename: 'alljs.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve : {
    alias: {
       modules: path.join(__dirname, "node_modules")
    }
  },
  module: {
    rules: [
      { test: /\.js$/,
        include: path.join(__dirname, 'src'),
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['env',"es2015"] }
        }
      },
      { test: /\.html$/,
        use: [{
          loader: "underscore-template-loader"
       }]
      },
      { test: /\.less$/, use: [
        { loader: "style-loader"},
        { loader: "css-loader", options: { sourceMap: true }},
        { loader: "less-loader",
          options: {
            strictMath: true,
            noIeCompat: true,
            sourceMap: true
          }
        }]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        exclude: /node_modules/,
        loader: "url-loader?limit=4096"
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({template: './src/index.html'}),
    new ExtractTextPlugin("allStyles.css"),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.ProvidePlugin({	_: "underscore", "window._": "underscore" }),
    new webpack.ProvidePlugin({	"THREE": "THREE" }),
    new webpack.ProvidePlugin({ $: "jquery", jQuery: "jquery","window.jQuery": "jquery" }),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true
      },
      compress: {
        screw_ie8: true
      },
      comments: false
    })
  ]
};
