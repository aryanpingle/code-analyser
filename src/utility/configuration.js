const {
  EMPTY_STRING,
  IGNORED_FILES_REGEX,
  IGNORED_FOLDERS_REGEX,
} = require("./constants");

// Global Configuration object which will be used to decide which files have to be parsed
const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkDependenciesAtGivenDepth: false,
  checkFilesContributingInMultipleChunks: false,
  checkChunkMetadataUsingGivenFile: false,
  include: [],
  exclude: [IGNORED_FILES_REGEX, IGNORED_FOLDERS_REGEX],
  rootDirectory: EMPTY_STRING,
  isDepthFromFront: false,
  checkAll: false,
  totalFilesToShow: -1,
  depth: 1,
  interact: false,
};

// Used to cache already computed dependencies of a given file (Used when checking chunk metadata of a given file)
const cachedMapping = {};

module.exports = { codeAnalyerConfigurationObject, cachedMapping };
