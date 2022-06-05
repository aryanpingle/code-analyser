const { updateFilesMetadata } = require("../utility/files");
const { traverseAST, buildAST, getDefaultFileObject } = require("../ast/index");

const checkUsingEntryFile = (
  entyFileLocation,
  filesMetadata,
  webpackChunkName
) => {
  if (!filesMetadata.filesMapping[entyFileLocation]) {
    filesMetadata.filesMapping[entyFileLocation] =
      getDefaultFileObject(entyFileLocation);
  }
  filesMetadata.filesMapping[entyFileLocation].isEntryFile = true;
  filesMetadata.filesMapping[entyFileLocation].webpackChunkConfiguration[
    webpackChunkName
  ] = true;
  if (
    isFileNotVisited(entyFileLocation, filesMetadata) &&
    isFileExtensionValid(entyFileLocation)
  ) {
    traverseFile(entyFileLocation, filesMetadata, webpackChunkName);
  }
};

const traverseFile = (fileLocation, filesMetadata, webpackChunkName) => {
  filesMetadata.visitedFilesMapping[fileLocation] = true;
  try {
    let ast = buildAST(fileLocation);
    let currentFileMetadata = {
      importedVariables: {},
      importedFilesMapping: {},
      fileLocation,
    };
    traverseAST(ast, currentFileMetadata, "CHECK_USAGE", filesMetadata);
    ast = null;
    let importedFilesMapping = currentFileMetadata.importedFilesMapping;
    for (const file in importedFilesMapping) {
      if (
        isFileNotVisited(file, filesMetadata) &&
        isFileExtensionValid(file) &&
        isFileNotExcluded(file, filesMetadata.excludedPointsRegex)
      ) {
        traverseFile(file, filesMetadata);
      } else if (
        isFileMappingNotPresent(file, filesMetadata) &&
        isFileNotExcluded(file, filesMetadata.excludedPointsRegex)
      ) {
        filesMetadata.filesMapping[file] = getDefaultFileObject(file);
      }
    }
    currentFileMetadata = null;
    importedFilesMapping = null;
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
