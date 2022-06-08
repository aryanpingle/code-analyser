module.exports = {
  intraModuleDependencies: {
    check: true, // True or false
    entry: [/\.[jt]sx?/i], // Regex or can be absolute/relative file path
    depth: 2, // Integer
    moduleToCheck:
    "../react-typescript-example/src/components/XxxHeader", // module to check for intra-dependencies
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]sx?$/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  rootDirectory: "./",
  directoriesToCheck: [
    "../react-typescript-example/src",
  ],
};
