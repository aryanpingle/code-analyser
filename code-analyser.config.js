module.exports = {
  intraModuleDependencies: {
    check: true, // True or false
    entry: [/\.[jt]sx?/i], // Regex or can be absolute/relative file path
    depth: 1, // Integer
    moduleToCheck: "./index.js", // module to check for intra-dependencies
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]sx?$/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  rootDirectory: "./",
  directoriesToCheck: ["./"],
};
