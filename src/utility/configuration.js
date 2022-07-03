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
export const codeAnalyserConfigurationObject = {
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
          codeAnalyserConfigurationObject[configurationName] =
            getArrayOfElementsFromString(subObject);
          break;
        case "include":
          codeAnalyserConfigurationObject[configurationName].push(
            ...getArrayOfElementsFromString(subObject)
          );
          break;
        case "exclude":
          codeAnalyserConfigurationObject[configurationName].push(
            ...getArrayOfElementsFromString(subObject)
          );
          break;
        case "checkDeadFiles":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkDependenciesAtGivenDepth":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkFilesContributingInMultipleChunks":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkChunkMetadataUsingGivenChunk":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "isDepthFromFront":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "moduleToCheck":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject, true);
          break;
        case "directoriesToCheck":
          codeAnalyserConfigurationObject[configurationName] =
            getArrayOfElementsFromString(subObject);
          break;
        case "rootDirectory":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject, true);
          break;
        case "depth":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "interact":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "checkAll":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
        case "totalFilesToShow":
          codeAnalyserConfigurationObject[configurationName] =
            getRequiredTypeElementFromString(subObject);
          break;
      }
    }
  );
  if (codeAnalyserConfigurationObject.directoriesToCheck)
    codeAnalyserConfigurationObject.include.push(
      ...codeAnalyserConfigurationObject.directoriesToCheck
    );
})();

// Used to cache already computed dependencies of a given file (Used when checking chunk metadata of a given file)
export const cacheMapping = {};
