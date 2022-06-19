const { isFilePath } = require("./resolver");

const isDeadfileCheckRequired = (programConfiguration) =>
  programConfiguration && programConfiguration.checkDeadFiles;

const isIntraModuleDependenciesCheckRequired = (programConfiguration) =>
  programConfiguration && programConfiguration.checkIntraModuleDependencies;

const isDuplicatedFilesCheckRequired = (programConfiguration) =>
  programConfiguration && programConfiguration.checkDuplicateFiles;

const isInstanceofRegexExpression = (givenString) =>
  givenString instanceof RegExp;

const isFileMappingNotPresent = (file, filesMetadata) =>
  !filesMetadata.filesMapping[file];

const isFileNotExcluded = (excludedFilesRegex, directoyAbsoluteAddress) =>
  isFilePath(directoyAbsoluteAddress) &&
  !excludedFilesRegex.test(directoyAbsoluteAddress);

// Valid extensions to parse are .js, .jsx, .ts, .tsx
const isFileExtensionNotValid = (fileLocation) =>
  !/[jt]sx?$/.test(fileLocation);

const isFileNotVisited = (fileLocation, filesMetadata) =>
  !filesMetadata.visitedFilesMapping[fileLocation];

const isFileExtensionValid = (fileLocation) => /\.[jt]sx?$/.test(fileLocation);

const isCheckingForFileChunks = (checkStaticImports) => !checkStaticImports;

module.exports = {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
  isDuplicatedFilesCheckRequired,
  isInstanceofRegexExpression,
  isFileNotExcluded,
  isFileExtensionNotValid,
  isFileMappingNotPresent,
  isFileNotVisited,
  isFileExtensionValid,
  isCheckingForFileChunks,
};