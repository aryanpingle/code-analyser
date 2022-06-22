const {
  EMPTY_STRING,
  IGNORED_FILES_REGEX,
  IGNORED_FOLDERS_REGEX,
} = require("./constants");

// Global Configuration object which will be used to decide which files have to be parsed
const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkIntraModuleDependencies: false,
  checkDuplicateFiles: false,
  include: [],
  exclude: [IGNORED_FILES_REGEX, IGNORED_FOLDERS_REGEX],
  rootDirectory: EMPTY_STRING,
  isDepthFromFront: false,
  checkAll: false,
  depth: 1,
  interact: false,
};

module.exports = codeAnalyerConfigurationObject;
