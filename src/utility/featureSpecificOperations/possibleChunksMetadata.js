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
  cachedMapping[fileLocation] = currentFilesSet;
  for (const dependentFile in filesMetadata.filesMapping[fileLocation]
    .staticImportFilesMapping) {
    if (!isFileNotExcluded(excludedRegex, dependentFile)) continue;
    const dependentFileSet = cachedMapping[dependentFile]
      ? cachedMapping[dependentFile]
      : getAllDependentFiles(dependentFile, {
          filesMetadata,
          cachedMapping,
          excludedRegex,
        });
    for (const dependentFileSetElement of dependentFileSet) {
      currentFilesSet.add(dependentFileSetElement);
    }
  }
  cachedMapping[fileLocation] = currentFilesSet;
  return currentFilesSet;
};

module.exports = { getAllDependentFiles };
