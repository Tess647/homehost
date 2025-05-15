const { merge } = require('webpack-merge');

const common = require('./webpack.common');

console.log('Webpack dev port:', process.env.PORT);
module.exports = merge(common, {
  // Set the mode to development or production
  mode: 'development',

  // Control how source maps are generated
  devtool: 'inline-source-map',

  // Spin up a server for quick development
  devServer: {
    historyApiFallback: true,
    open: true,
    compress: true,
    hot: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.url, '→', proxyReq.path);
      }
    }
    },
  }
});
