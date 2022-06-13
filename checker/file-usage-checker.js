const { traverseAST, buildAST } = require("../ast/index");
const {
  getDefaultFileObject,
  getDefaultCurrentFileMetadata,
} = require("../utility/files");
const {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
  getUsedFilesMapping,
} = require("./utility");

/**
 * Will be used to check file to update the imported, exported variables when they are regerred
 * @param {String} entyFileLocation Address of the entry file
 * @param {Object} filesMetadata Object containing information related to all files
 */
const checkFileUsage = (entyFileLocation, filesMetadata) => {
  if (isFileMappingNotPresent(entyFileLocation, filesMetadata)) {
    filesMetadata.filesMapping[entyFileLocation] =
      getDefaultFileObject(entyFileLocation);
  }
  filesMetadata.filesMapping[entyFileLocation].isEntryFile = true;
  if (
    isFileNotVisited(entyFileLocation, filesMetadata) &&
    isFileExtensionValid(entyFileLocation)
  ) {
    traverseFileForCheckingUsage(entyFileLocation, filesMetadata);
  }
};

/**
 * Will be used to remove imported file's references made for this file
 * @param {String} deadFileLocation String denoting the absolute address of a dead file
 * @param {Object} filesMetadata Contains information related to all files
 */
const checkDeadFileImportsUsage = (deadFileLocation, filesMetadata) => {
  if (
    isFileExtensionValid(deadFileLocation) &&
    isFileNotExcluded(deadFileLocation, filesMetadata.excludedFilesRegex)
  ) {
    try {
      let ast = buildAST(deadFileLocation);
      let currentFileMetadata = getDefaultCurrentFileMetadata(deadFileLocation);
      let traversalRelatedMetadata = {
        ast,
        currentFileMetadata,
        filesMetadata,
        addReferences: false,
      };
      traverseAST(traversalRelatedMetadata, "CHECK_USAGE");
    } catch (_) {
      console.error("Unable to parse file:", deadFileLocation);
      console.error(err);
    }
  }
};

/**
 * This function will traverse a file to find usage of each imported, and exported variable
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 */
const traverseFileForCheckingUsage = (fileLocation, filesMetadata) => {
  filesMetadata.visitedFilesMapping[fileLocation] = true;
  try {
    let ast = buildAST(fileLocation);
    let currentFileMetadata = getDefaultCurrentFileMetadata(fileLocation);
    let traversalRelatedMetadata = {
      ast,
      currentFileMetadata,
      filesMetadata,
    };
    traverseAST(traversalRelatedMetadata, "CHECK_USAGE");
    let requiredImportedFilesMapping = getUsedFilesMapping(currentFileMetadata);
    // Setting ast as null, to save memory, will build it again after traversing all imported files of the current file
    ast = null;
    currentFileMetadata = null;
    traversalRelatedMetadata = null;
    for (const file in requiredImportedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(file, filesMetadata.excludedFilesRegex)
      ) {
        if (!filesMetadata.filesMapping[file]) {
          filesMetadata.filesMapping[file] = getDefaultFileObject(file);
        }
        traverseFileForCheckingUsage(file, filesMetadata);
      } else if (
        isFileMappingNotPresent(file, filesMetadata) &&
        isFileNotExcluded(file, filesMetadata.excludedFilesRegex)
      ) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }
  } catch (err) {
    // If some error is found during parsing, reporting it back on the console
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

module.exports = { checkFileUsage, checkDeadFileImportsUsage };
