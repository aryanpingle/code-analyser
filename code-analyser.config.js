module.exports = {
  intraModuleDependencies: {
    check: true,
    entryModule: "../react-projects/23-quiz/final/src/index.js",
  },
  deadFiles: {
    check: false,
    entry: [/final\/src\/index\.js/i],
  },
  exclude: [/node_modules|(\.git)/],
  directoriesToCheck: ["../react-projects/23-quiz/final"],
  // directoriesToCheck: ["../todomvc-redux-react-typescript/client/"],
};
