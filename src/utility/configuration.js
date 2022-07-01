import yargs from "yargs";
import {
  EMPTY_STRING,
  IGNORED_FILES_REGEX,
  IGNORED_FOLDERS_REGEX,
} from "./constants.js";
import {
  getRequiredTypeElementFromString,
  getArrayOfElementsFromString,
} from "./parseElements.js";

// Global Configuration object which will be used to decide which files have to be parsed
export const codeAnalyerConfigurationObject = {
  checkDeadFiles: false,
  checkDependenciesAtGivenDepth: false,
  checkFilesContributingInMultipleChunks: false,
  checkChunkMetadataUsingGivenChunk: false,
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
(() => {
  const configurationObject = yargs(process.argv).parse();
  Object.entries(configurationObject).forEach(
    ([configurationName, subObject]) => {
      switch (configurationName) {
        case "entry":
          codeAnalyerConfigurationObject[configurationName] =
            getArrayOfElementsFromString(subObject);
          break;
        case "include":
          codeAnalyerConfigurationObject[configurationName].push(
            ...getArrayOfElementsFromString(subObject)
          );
          break;
        case "exclude":
          codeAnalyerConfigurationObject[configurationName].push(
            ...getArrayOfElementsFromString(subObject)
          );
          break;
        case "checkDeadFiles":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkDependenciesAtGivenDepth":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkFilesContributingInMultipleChunks":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkChunkMetadataUsingGivenChunk":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "isDepthFromFront":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "moduleToCheck":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject, true);
          break;
        case "directoriesToCheck":
          codeAnalyerConfigurationObject[configurationName] =
            getArrayOfElementsFromString(subObject);
          break;
        case "rootDirectory":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject, true);
          break;
        case "depth":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "interact":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkAll":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "totalFilesToShow":
          codeAnalyerConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
      }
    }
  );
  if (codeAnalyerConfigurationObject.directoriesToCheck)
    codeAnalyerConfigurationObject.include.push(
      ...codeAnalyerConfigurationObject.directoriesToCheck
    );
})();

// Used to cache already computed dependencies of a given file (Used when checking chunk metadata of a given file)
export const cacheMapping = {};
