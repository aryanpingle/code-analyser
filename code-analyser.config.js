module.exports = {
  intraModuleDependencies: {
    check: true,
    entry: [/\.js/i],
    moduleToCheck: "../teams-clone/client/src/pages",
  },
  deadFiles: {
    check: false,
    entry: [/src\/index\.[jt]s/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/],
  directoriesToCheck: ["../teams-clone/client/src/"],
  // directoriesToCheck: ["../todomvc-redux-react-typescript/client/"],
};
