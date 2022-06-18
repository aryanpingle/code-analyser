const { traverseAST, buildAST } = require("../ast/index");
const {
  updateFilesMetadata,
  getDefaultCurrentFileMetadata,
} = require("../utility/files");
const { getDefaultFileObject } = require("../ast/utility");
const {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
} = require("../utility/conditional-expressions-checks");
const { getUsedFilesMapping } = require("./utility");
/**
 * Will be used to check file to get it's import and export variables, which will be used in the next stage where there usage will be checked
 * @param {String} entyFileLocation Address of the entry file
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {Object} entryFilesMapping Mapping to check whether a given file is entry file or not
 */
const checkFileImportExports = (
  entyFileLocation,
  filesMetadata,
  entryFilesMapping
) => {
  if (isFileMappingNotPresent(entyFileLocation, filesMetadata)) {
    filesMetadata.filesMapping[entyFileLocation] =
      getDefaultFileObject(entyFileLocation);
  }
  filesMetadata.filesMapping[entyFileLocation].isEntryFile = true;
  if (
    isFileNotVisited(entyFileLocation, filesMetadata) &&
    isFileExtensionValid(entyFileLocation)
  ) {
    traverseFileForCheckingImportsExports(
      entyFileLocation,
      filesMetadata,
      entryFilesMapping
    );
  }
};

/**
 * This function will traverse a file to get all imports and exports variable
 * Will also set their corresponding objects (imports will refer exported variables' objects)
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {Object} entryFilesMapping To check whether a file is entry file or not
 */
const traverseFileForCheckingImportsExports = (
  fileLocation,
  filesMetadata,
  entryFilesMapping
) => {
  filesMetadata.visitedFilesMapping[fileLocation] = true;
  try {
    let ast = buildAST(fileLocation);
    let currentFileMetadata = getDefaultCurrentFileMetadata(fileLocation);
    let traversalRelatedMetadata = {
      ast,
      currentFileMetadata,
      filesMetadata,
    };
    traverseAST(traversalRelatedMetadata, "CHECK_IMPORTS");
    updateFilesMetadata(filesMetadata, currentFileMetadata);
    let requiredImportedFilesMapping = getUsedFilesMapping(currentFileMetadata);
    // Setting ast as null, to save memory, will build it again after traversing all imported files of the current file
    ast = null;
    currentFileMetadata = null;
    traversalRelatedMetadata = null;

    for (const file in requiredImportedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(filesMetadata.excludedFilesRegex, file)
      ) {
        if (!filesMetadata.filesMapping[file]) {
          filesMetadata.filesMapping[file] = getDefaultFileObject(file);
        }
        traverseFileForCheckingImportsExports(
          file,
          filesMetadata,
          entryFilesMapping
        );
      } else if (
        isFileMappingNotPresent(file, filesMetadata) &&
        isFileNotExcluded(filesMetadata.excludedFilesRegex, file)
      ) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }

    ast = buildAST(fileLocation);
    let isEntryFile = entryFilesMapping[fileLocation] ? true : false;
    currentFileMetadata = getDefaultCurrentFileMetadata(
      fileLocation,
      isEntryFile
    );
    traversalRelatedMetadata = {
      ast,
      currentFileMetadata,
      filesMetadata,
    };

    traverseAST(traversalRelatedMetadata, "CHECK_EXPORTS");
    updateFilesMetadata(filesMetadata, currentFileMetadata);
  } catch (err) {
    // If some error is found during parsing, reporting it back on the console
    filesMetadata.unparsableVistedFiles++;
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

module.exports = { checkFileImportExports };
