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
 * @param {String} traverseType To decide whether deadfiles or intra-module dependencies have to be identified
 */
const checkFileImportsExports = (
  entyFileLocation,
  filesMetadata,
  traverseType
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
    traverseFileForImportsAndExports(
      entyFileLocation,
      filesMetadata,
      traverseType  
    );
  }
};

/**
 * This function will traverse a file to get all imports and exports variable
 * Will also set their corresponding objects (imports will refer exported variables' objects)
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {String} traverseType To decide whether deadfiles or intra-module dependencies have to be identified
 */
const traverseFileForImportsAndExports = (
  fileLocation,
  filesMetadata,
  traverseType
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
    // Setting ast as null, to save memory, will build it again after traversing all imported files of the current file
    ast = null;
    traversalRelatedMetadata.ast = null;

    // If we are checking dead file then check all imported files of this file else traverse only statically imported files
    // Because statically imported files will be present in the same chunk
    let requiredImportedFilesMapping = "DEADFILE_FINDER_TRAVERSE"
      ? currentFileMetadata.importedFilesMapping
      : currentFileMetadata.staticImportFilesMapping;

    for (const file in requiredImportedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(file, filesMetadata.excludedFilesRegex)
      ) {
        if (!filesMetadata.filesMapping[file]) {
          filesMetadata.filesMapping[file] = getDefaultFileObject(file);
        }
        traverseFileForImportsAndExports(file, filesMetadata, traverseType);
      } else if (isFileMappingNotPresent(file, filesMetadata)) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }

    ast = buildAST(fileLocation);
    traversalRelatedMetadata.ast = ast;
    traverseAST(traversalRelatedMetadata, "CHECK_EXPORTS");
    updateFilesMetadata(filesMetadata, currentFileMetadata);
  } catch (err) {
    // If some error is found during parsing, reporting it back on the console
    filesMetadata.unparsableVistedFiles++;
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

module.exports = { checkFileImportsExports };
