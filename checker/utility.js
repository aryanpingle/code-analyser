const { isFilePath } = require("../utility/resolver");

const isFileNotVisited = (fileLocation, filesMetadata) =>
  !filesMetadata.visitedFilesMapping[fileLocation];

const isFileExtensionValid = (fileLocation) =>
  /\.(js|jsx|ts|tsx)$/.test(fileLocation);

const isFileNotExcluded = (file, excludedFilesRegex) =>
  isFilePath(file) && !excludedFilesRegex.test(file);

const isFileMappingNotPresent = (file, filesMetadata) =>
  !filesMetadata.filesMapping[file];

const getUsedFilesMapping = (currentFileMetadata) => {
  const usedFilesMapping = {};
  const visitedFilesMapping = {};
  const importedVariablesMapping =
    currentFileMetadata.importedVariablesMetadata;
  for (const variable in importedVariablesMapping) {
    visitedFilesMapping[importedVariablesMapping[variable].importedFrom] = true;
    if (importedVariablesMapping[variable].referenceCountObject.referenceCount) {
      usedFilesMapping[importedVariablesMapping[variable].importedFrom] = true;
    }
  }
  for (const file in currentFileMetadata.importedFilesMapping) {
    if (!visitedFilesMapping[file]) usedFilesMapping[file] = true;
  }
  return usedFilesMapping;
};

module.exports = {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
  getUsedFilesMapping,
};
