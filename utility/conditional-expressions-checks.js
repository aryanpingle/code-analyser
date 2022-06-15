const { isFilePath } = require("./resolver");

const isDeadfileCheckRequired = (programConfiguration) =>
  programConfiguration && programConfiguration.checkDeadFiles;

const isIntraModuleDependenciesCheckRequired = (programConfiguration) =>
  programConfiguration && programConfiguration.checkIntraModuleDependencies;

const isInstanceofRegexExpression = (givenString) =>
  givenString instanceof RegExp;

const isFileNotExcluded = (excludedFilesRegex, directoyAbsoluteAddress) =>
  isFilePath(directoyAbsoluteAddress) &&
  !excludedFilesRegex.test(directoyAbsoluteAddress);

module.exports = {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
  isInstanceofRegexExpression,
  isFileNotExcluded,
};
