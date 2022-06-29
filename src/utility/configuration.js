const yargs = require("yargs");
const {
  EMPTY_STRING,
  IGNORED_FILES_REGEX,
  IGNORED_FOLDERS_REGEX,
} = require("./constants");
const {
  getRequiredTypeElementFromString,
  getArrayOfElementsFromString,
} = require("./parseElements");

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

/**
 * Will be called to set the configuration of the program using the arguments provided on the CLI
 */
const setConfiguration = () => {
  const configurationObject = yargs.argv;
  for (const configuration in configurationObject) {
    switch (configuration) {
      case "entry":
        codeAnalyerConfigurationObject[configuration] =
          getArrayOfElementsFromString(configurationObject[configuration]);
        break;
      case "include":
        codeAnalyerConfigurationObject[configuration].push(
          ...getArrayOfElementsFromString(configurationObject[configuration])
        );
        break;
      case "exclude":
        codeAnalyerConfigurationObject[configuration].push(
          ...getArrayOfElementsFromString(configurationObject[configuration])
        );
        break;
      case "checkDeadFiles":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkDependenciesAtGivenDepth":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkFilesContributingInMultipleChunks":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkChunkMetadataUsingGivenFile":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "isDepthFromFront":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "moduleToCheck":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(
            configurationObject[configuration],
            true
          );
        break;
      case "directoriesToCheck":
        codeAnalyerConfigurationObject[configuration] =
          getArrayOfElementsFromString(configurationObject[configuration]);
        break;
      case "rootDirectory":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(
            configurationObject[configuration],
            true
          );
        break;
      case "depth":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "interact":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkAll":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "totalFilesToShow":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
    }
  }
  if (codeAnalyerConfigurationObject.directoriesToCheck)
    codeAnalyerConfigurationObject.include.push(
      ...codeAnalyerConfigurationObject.directoriesToCheck
    );
};

// Used to cache already computed dependencies of a given file (Used when checking chunk metadata of a given file)
const cacheMapping = {};

module.exports = {
  codeAnalyerConfigurationObject,
  setConfiguration,
  cacheMapping,
};
