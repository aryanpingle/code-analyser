const isDeadfileCheckRequired = (programConfiguration) =>
  programConfiguration &&
  programConfiguration.deadFiles &&
  programConfiguration.deadFiles.check;

const isIntraModuleDependenciesCheckRequired = (programConfiguration) =>
  programConfiguration &&
  programConfiguration.intraModuleDependencies &&
  programConfiguration.intraModuleDependencies.check;

const isInstanceofRegexExpression = (givenString) =>
  givenString instanceof RegExp;

const isFileNotExcluded = (excludedFilesRegex, directoyAbsoluteAddress) =>
  !excludedFilesRegex.test(directoyAbsoluteAddress);

module.exports = {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
  isInstanceofRegexExpression,
  isFileNotExcluded,
};
