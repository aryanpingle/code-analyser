const { isFileNotExcluded } = require("../helper");
const { cachedMapping } = require("../configuration");

/**
 * Function to find all the dependencies of the provided file and their file sizes
 * @param {String} fileLocation File whose dependencies are needed
 * @param {Object} metadata Contains information related to all files, and regex to exclude unwanted dependencies
 * @returns Set containing all dependencies of a given file along with their size
 */
const getAllDependentFiles = (
  fileLocation,
  { filesMetadata, excludedRegex }
) => {
  const currentFilesSet = new Set();
  currentFilesSet.add(fileLocation);
  cachedMapping[fileLocation] = {
    dependencySet: currentFilesSet,
    effectiveSize: filesMetadata.filesMapping[fileLocation].fileSize,
  };
  for (const dependentFile in filesMetadata.filesMapping[fileLocation]
    .staticImportFilesMapping) {
    if (!isFileNotExcluded(excludedRegex, dependentFile)) continue;
    const dependentFileSet = cachedMapping[dependentFile]
      ? cachedMapping[dependentFile].dependencySet
      : getAllDependentFiles(dependentFile, {
          filesMetadata,
          cachedMapping,
          excludedRegex,
        });
    for (const dependentFileSetElement of dependentFileSet) {
      currentFilesSet.add(dependentFileSetElement);
    }
  }
  cachedMapping[fileLocation] = {
    dependencySet: currentFilesSet,
    effectiveSize: getEffectiveSizeFromSet(
      Array.from(currentFilesSet),
      filesMetadata
    ),
  };
  return currentFilesSet;
};

const getEffectiveSizeFromSet = (currentFilesArray, filesMetadata) => {
  return currentFilesArray.reduce((reducedValue, file) => {
    return (
      reducedValue +
      (filesMetadata.filesMapping[file] &&
      filesMetadata.filesMapping[file].fileSize
        ? filesMetadata.filesMapping[file].fileSize
        : 0)
    );
  }, 0);
};
module.exports = { getAllDependentFiles };
