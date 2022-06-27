const process = require("process");
const { traverseAST, buildAST } = require("../ast/index");
const { getDefaultCurrentFileMetadata } = require("../utility/files");
const { getDefaultFileObject } = require("../ast/common");
const {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
} = require("../utility/helper");
const {
  CHECK_STATIC_IMPORTS_ADDRESSES,
  CHECK_ALL_IMPORTS_ADDRESSES,
  DISPLAY_TEXT,
} = require("../utility/constants");
const { getFileSize } = require("./utility");
/**
 * Will be used to check a given file's imports (used while detecting dependencies at a given depth/ files contributing in multiple chunks)
 * @param {String} entyFileLocation Address of the entry file
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {Boolean} checkStaticImportsOnly To decide whether only static imports of a file have to be checked or not
 */
const checkFileImports = (
  entyFileLocation,
  filesMetadata,
  { checkStaticImportsOnly, checkForFileSize = false }
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
    traverseFileForImports(entyFileLocation, filesMetadata, {
      checkStaticImportsOnly,
      checkForFileSize,
    });
  }
};

/**
 * This function will traverse a file to get it's imported/ statically imported files
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {Boolean} checkStaticImportsOnly To decide whether only static imports of a file have to be checked or not
 */
const traverseFileForImports = (
  fileLocation,
  filesMetadata,
  { checkStaticImportsOnly, checkForFileSize }
) => {
  filesMetadata.visitedFilesMapping[fileLocation] = true;
  try {
    if (
      checkStaticImportsOnly &&
      !filesMetadata.insideModuleRegex.test(fileLocation)
    )
      return;
    let ast = buildAST(fileLocation);
    let currentFileMetadata = getDefaultCurrentFileMetadata(fileLocation);
    let traversalRelatedMetadata = {
      ast,
      currentFileMetadata,
      filesMetadata,
    };
    const traverseType = checkStaticImportsOnly
      ? CHECK_STATIC_IMPORTS_ADDRESSES
      : CHECK_ALL_IMPORTS_ADDRESSES;
    traverseAST(traversalRelatedMetadata, traverseType);
    if (checkForFileSize)
      filesMetadata.filesMapping[fileLocation].fileSize = getFileSize(
        ast,
        fileLocation
      );

    // Whether we need to check for static imports or should we include dynamic imports too
    let requiredImportedFilesMapping = checkStaticImportsOnly
      ? currentFileMetadata.staticImportFilesMapping
      : currentFileMetadata.importedFilesMapping;
    // If we are checking to find files which are contributing in multiple chunks, therefore would need to traverse all files

    filesMetadata.filesMapping[fileLocation].staticImportFilesMapping =
      currentFileMetadata.staticImportFilesMapping;
    // Setting ast as null, to save memory
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
        traverseFileForImports(file, filesMetadata, {
          checkStaticImportsOnly,
          checkForFileSize,
        });
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
    process.send({
      text: err,
      fileLocation,
      messageType: DISPLAY_TEXT,
    });
  }
};

module.exports = { checkFileImports };
