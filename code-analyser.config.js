module.exports = {
  intraModuleDependencies: {
    check: true, // True or false
    entry: [/\.[jt]sx?/i], // Regex or can be absolute/relative file path
    depth: 1,
    moduleToCheck:
      "./index.js", // module to check for intradependency
  },
  deadFiles: {
    check: false,
    entry: [/index\.[jt]s$/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  rootDirectory: "./",
  directoriesToCheck: [
    "./",
  ],
  // directoriesToCheck: ["./"],
};
