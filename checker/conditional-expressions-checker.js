const isFileNotVisited = (fileLocation, filesMetadata) =>
  !filesMetadata.visitedFilesMapping[fileLocation];
const isFileExtensionValid = (fileLocation) =>
  /\.(js|jsx|ts|tsx)$/.test(fileLocation);
const isFileNotExcluded = (file, excludedFilesRegex) =>
  !excludedFilesRegex.test(file);
const isFileMappingNotPresent = (file, filesMetadata) =>
  !filesMetadata.filesMapping[file];

module.exports = {
  isFileExtensionValid,
  isFileNotVisited,
  isFileMappingNotPresent,
  isFileNotExcluded,
};
