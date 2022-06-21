const { traverseAST, buildAST } = require("../ast/index");
const { getDefaultCurrentFileMetadata } = require("../utility/files");
const { getDefaultFileObject } = require("../ast/utility");
const {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
  isCheckingForFileChunks,
} = require("../utility/helper");
const {
  CHECK_STATIC_IMPORTS_ADDRESSES,
  CHECK_ALL_IMPORTS_ADDRESSES,
} = require("../utility/constants");
const { displayFileParseErrorMessage } = require("../utility/cli");

/**
 * Will be used to check a given file's imports (used while detecting intra-module dependencies/ duplicate files)
 * @param {String} entyFileLocation Address of the entry file
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {Boolean} checkStaticImportsOnly To decide whether only static imports of a file have to be checked or not
 */
const checkFileImports = (
  entyFileLocation,
  filesMetadata,
  checkStaticImportsOnly
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
    traverseFileForStaticImports(
      entyFileLocation,
      filesMetadata,
      checkStaticImportsOnly
    );
  }
};

/**
 * This function will traverse a file to get it's imported/ statically imported files
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {Boolean} checkStaticImports To decide whether only static imports of a file have to be checked or not
 */
const traverseFileForStaticImports = (
  fileLocation,
  filesMetadata,
  checkStaticImports
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
    const traverseType = checkStaticImports
      ? CHECK_STATIC_IMPORTS_ADDRESSES
      : CHECK_ALL_IMPORTS_ADDRESSES;
    traverseAST(traversalRelatedMetadata, traverseType);

    // Whether we need to check for static imports or should we include dynamic imports too
    let requiredImportedFilesMapping = checkStaticImports
      ? currentFileMetadata.staticImportFilesMapping
      : currentFileMetadata.importedFilesMapping;
    // If we are checking to find duplicate files, therefore would need to traverse all files
    if (isCheckingForFileChunks(checkStaticImports)) {
      filesMetadata.filesMapping[fileLocation].staticImportFilesMapping =
        currentFileMetadata.staticImportFilesMapping;
    }
    // Setting ast as null, to save memory
    ast = null;
    currentFileMetadata = null;
    traversalRelatedMetadata = null;
    if (
      !checkStaticImports ||
      filesMetadata.insideModuleRegex.test(fileLocation)
    )
      for (const file in requiredImportedFilesMapping) {
        if (
          isFileNotVisited(file, filesMetadata) &&
          isFileExtensionValid(file) &&
          isFileNotExcluded(filesMetadata.excludedFilesRegex, file)
        ) {
          if (!filesMetadata.filesMapping[file]) {
            filesMetadata.filesMapping[file] = getDefaultFileObject(file);
          }
          traverseFileForStaticImports(file, filesMetadata, checkStaticImports);
        } else if (
          isFileMappingNotPresent(file, filesMetadata) &&
          isFileNotExcluded(filesMetadata.excludedFilesRegex, file)
        ) {
          filesMetadata.filesMapping[file] = getDefaultFileObject(file);
        }
      }
  } catch (err) {
    // If some error is found during parsing, reporting it back on the console
    filesMetadata.unparsableVistedFiles++;
    displayFileParseErrorMessage(fileLocation, err);
  }
};

module.exports = { checkFileImports };
