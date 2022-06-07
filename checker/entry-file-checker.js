const { traverseAST, buildAST, getDefaultFileObject } = require("../ast/index");

const checkUsingEntryFile = (entyFileLocation, filesMetadata, traverseType) => {
  if (!filesMetadata.filesMapping[entyFileLocation]) {
    filesMetadata.filesMapping[entyFileLocation] =
      getDefaultFileObject(entyFileLocation);
  }
  filesMetadata.filesMapping[entyFileLocation].isEntryFile = true;
  if (
    isFileNotVisited(entyFileLocation, filesMetadata) &&
    isFileExtensionValid(entyFileLocation)
  ) {
    traverseFile(entyFileLocation, filesMetadata, traverseType);
  }
};

const traverseFile = (fileLocation, filesMetadata, traverseType) => {
  filesMetadata.visitedFilesMapping[fileLocation] = true;
  try {
    let ast = buildAST(fileLocation);
    let currentFileMetadata = {
      importedVariables: {},
      importedFilesMapping: {},
      staticImportFilesMapping: {},
      fileLocation,
    };
    traverseAST(ast, currentFileMetadata, "CHECK_USAGE", filesMetadata);
    ast = null;
    let requiredImportedFilesMapping =
      traverseType === "DEADFILE_FINDER_TRAVERSE"
        ? currentFileMetadata.importedFilesMapping
        : currentFileMetadata.staticImportFilesMapping;
    for (const file in requiredImportedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(file, filesMetadata.excludedPointsRegex)
      ) {
        traverseFile(file, filesMetadata);
      } else if (
        isFileMappingNotPresent(file, filesMetadata)
      ) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }
    currentFileMetadata = null;
    requiredImportedFilesMapping = null;
  } catch (err) {
    filesMetadata.unparsableVistedFiles++;
    console.error("Unable to parse file:", fileLocation);
    console.error(err);
  }
};

const isFileNotVisited = (fileLocation, filesMetadata) =>
  !filesMetadata.visitedFilesMapping[fileLocation];
const isFileExtensionValid = (fileLocation) =>
  /\.(js|jsx|ts|tsx)$/.test(fileLocation);
const isFileNotExcluded = (file, excludedPointsRegex) =>
  !excludedPointsRegex.test(file);
const isFileMappingNotPresent = (file, filesMetadata) =>
  !filesMetadata.filesMapping[file];

module.exports = { checkUsingEntryFile };
