const {
  EMPTY_STRING,
  IGNORED_FILES_REGEX,
  IGNORED_FOLDERS_REGEX,
} = require("./constants");

// Global Configuration object which will be used to decide which files have to be parsed
const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkDependenciesAtGivenDepth: false,
  checkDuplicateFiles: false,
  checkPossibleChunksMetadata: false,
  include: [],
  exclude: [IGNORED_FILES_REGEX, IGNORED_FOLDERS_REGEX],
  rootDirectory: EMPTY_STRING,
  isDepthFromFront: false,
  checkAll: false,
  depth: 1,
  interact: false,
};

// Used to cache already computed dependencies of a given file (Used when checking possible chunks metadata)
const cachedMapping = {};

module.exports = { codeAnalyerConfigurationObject, cachedMapping };
