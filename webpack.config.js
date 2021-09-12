const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
      fallback: {
          'stream' : require.resolve('stream-browserify'),
          'buffer': require.resolve('buffer/'),
          'timers': require.resolve('timers-browserify')
      }
  }
};