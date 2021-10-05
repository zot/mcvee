const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const dev = true

module.exports = {
  mode: dev ? 'development' : 'production',
  devtool: 'source-map',
  entry: "./index.tsx",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "../dist"),
  },
  resolve: {
    extensions: ['...', '.js', '.ts', '.tsx',],
  },
  plugins: [
    new HtmlWebPackPlugin({template: "./index.html",}),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        include: [__dirname, path.resolve(__dirname, "../js"), path.resolve(__dirname, "../node_modules/react-mvc-lite/src")],
        loader: require.resolve('ts-loader'),
      },
    ],
  },
};
