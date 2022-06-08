const { traverseAST, buildAST } = require("../ast/index");
const { getDefaultCurrentFileMetadata } = require("../utility/files");
const {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
} = require("./conditional-expressions-checker");

/**
 * Will be used to check all files' exported variables references (to determine whether it is a live file or not)
 * @param {String} entyFileLocation Address of the entry file
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {String} traverseType To decide whether deadfiles or intra-module dependencies have to be identified
 */
const checkFileUsage = (entyFileLocation, filesMetadata, traverseType) => {
  if (
    isFileNotVisited(entyFileLocation, filesMetadata) &&
    isFileExtensionValid(entyFileLocation)
  ) {
    traverseFileToCheckVariablesUsage(
      entyFileLocation,
      filesMetadata,
      traverseType
    );
  }
};

/**
 * This function will traverse the given file to check which imported and exported variables of different files are being used inside it
 * @param {String} fileLocation Address of the file which has to be traversed
 * @param {Object} filesMetadata Object containing information related to all files
 * @param {String} traverseType To decide whether deadfiles or intra-module dependencies have to be identified
 */
const traverseFileToCheckVariablesUsage = (
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
    // Traversing AST with the objective to determine usage of imported/ exported variables
    traverseAST(traversalRelatedMetadata, "CHECK_USAGE");
    let requiredImportedFilesMapping =
      traverseType === "DEADFILE_FINDER_TRAVERSE"
        ? currentFileMetadata.importedFilesMapping
        : currentFileMetadata.staticImportFilesMapping;
    // Setting ast, and other local variables as null to save memory required by the program
    ast = null;
    currentFileMetadata = null;
    traversalRelatedMetadata = null;

    for (const file in requiredImportedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(file, filesMetadata.excludedFilesRegex)
      ) {
        traverseFileToCheckVariablesUsage(file, filesMetadata);
      } else if (isFileMappingNotPresent(file, filesMetadata)) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }
  } catch (err) {
    // If errors found, report them back on the console
    filesMetadata.unparsableVistedFiles++;
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

module.exports = { checkFileUsage };
