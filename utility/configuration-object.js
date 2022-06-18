// Global Configuration object which will be used to decide which files have to be parsed
const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkIntraModuleDependencies: false,
  checkDuplicateFiles: false,
  exclude: [/node_modules/],
  rootDirectory: "",
  isDepthFromFront: false,
  depth: 1,
};

module.exports = codeAnalyerConfigurationObject;
