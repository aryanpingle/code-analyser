const { traverseAST, buildAST } = require("../ast/index");
const {
  updateFilesMetadata,
  getDefaultFileObject,
  getDefaultCurrentFileMetadata,
} = require("../utility/files");
const {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
} = require("./conditional-expressions-checker");

/**
 * Will be used to check file to get it's import and export variables, which will be used in the next stage where there usage will be checked
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
 * This function will traverse a file to get all imports and exports variable
 * Will also set their corresponding objects (imports will refer exported variables' objects)
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
    traverseAST(traversalRelatedMetadata, "CHECK_IMPORTED_FILES_ADDRESSES");
    updateFilesMetadata(filesMetadata, currentFileMetadata);
    // Setting ast as null, to save memory, will build it again after traversing all imported files of the current file
    let requiredImportedFilesMapping = currentFileMetadata.importedFilesMapping;
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
      } else if (isFileMappingNotPresent(file, filesMetadata)) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }

    ast = buildAST(fileLocation);
    currentFileMetadata = getDefaultCurrentFileMetadata(fileLocation);
    traversalRelatedMetadata = { ast, currentFileMetadata, filesMetadata };
    traverseAST(traversalRelatedMetadata, "CHECK_USAGE");
    updateFilesMetadata(filesMetadata, currentFileMetadata);
  } catch (err) {
    // If some error is found during parsing, reporting it back on the console
    filesMetadata.unparsableVistedFiles++;
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

module.exports = { checkFileUsage };
