module.exports = {
  // entry: ['../todomvc-redux-react-typescript/client/index.js'],
  entry: {
    source: './index.js',
    checkIntraModuleDependencies: true,
  },
  exclude: [/node_modules|\.git/],
  directoriesToCheck: ['./'],
};
