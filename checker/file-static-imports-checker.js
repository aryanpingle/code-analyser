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
 * Will be used to check file to get it's statically imported variables, which will be used to find intra-module dependencies
 * @param {String} entyFileLocation Address of the entry file
 * @param {Object} filesMetadata Object containing information related to all files
 */
const checkFileStaticImport = (entyFileLocation, filesMetadata) => {
  if (isFileMappingNotPresent(entyFileLocation, filesMetadata)) {
    filesMetadata.filesMapping[entyFileLocation] =
      getDefaultFileObject(entyFileLocation);
  }
  filesMetadata.filesMapping[entyFileLocation].isEntryFile = true;
  if (
    isFileNotVisited(entyFileLocation, filesMetadata) &&
    isFileExtensionValid(entyFileLocation)
  ) {
    traverseFileForStaticImports(entyFileLocation, filesMetadata);
  }
};

/**
 * This function will traverse a file to get all statically imported variables
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 */
const traverseFileForStaticImports = (fileLocation, filesMetadata) => {
  filesMetadata.visitedFilesMapping[fileLocation] = true;
  try {
    let ast = buildAST(fileLocation);
    let currentFileMetadata = getDefaultCurrentFileMetadata(fileLocation);
    let traversalRelatedMetadata = {
      ast,
      currentFileMetadata,
      filesMetadata,
    };
    traverseAST(traversalRelatedMetadata, "CHECK_STATIC_IMPORTS_ADDRESSES");
    // Setting ast as null, to save memory
    ast = null;
    traversalRelatedMetadata = null;

    let requiredImportedFilesMapping =
      currentFileMetadata.staticImportFilesMapping;

    for (const file in requiredImportedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(file, filesMetadata.excludedFilesRegex)
      ) {
        if (!filesMetadata.filesMapping[file]) {
          filesMetadata.filesMapping[file] = getDefaultFileObject(file);
        }
        traverseFileForStaticImports(file, filesMetadata);
      } else if (isFileMappingNotPresent(file, filesMetadata)) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }
  } catch (err) {
    // If some error is found during parsing, reporting it back on the console
    filesMetadata.unparsableVistedFiles++;
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

module.exports = { checkFileStaticImport };
