const { EMPTY_STRING } = require("./constants");

// Global Configuration object which will be used to decide which files have to be parsed
const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkIntraModuleDependencies: false,
  checkDuplicateFiles: false,
  include: [],
  exclude: [],
  rootDirectory: EMPTY_STRING,
  isDepthFromFront: false,
  depth: 1,
};

module.exports = codeAnalyerConfigurationObject;
