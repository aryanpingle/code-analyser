const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkIntraModuleDependencies: false,
  entry: ["./"],
  exclude: [/node_modules/],
  directoriesToCheck: ["./"],
  rootDirectory: "./",
  moduleToCheck: "./",
  isDepthFromFront: false,
  depth: 1,
};

module.exports = codeAnalyerConfigurationObject;
