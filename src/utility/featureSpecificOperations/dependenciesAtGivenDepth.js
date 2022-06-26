const { DISPLAY_TEXT } = require("../constants");
const { isFileNotExcluded } = require("../helper");
const { isFilePath } = require("../resolver");
const { getFilePoints } = require("./common");

/**
 * Checks for all dependencies at a provided depth which were actually referred by any file
 * @param {Object} outsideModuleChecker Regex to decide whether a given file is a dependency at a given depth or not
 * @param {Object} filesMetadata Contains information related to all files
 * @returns Array of files which are dependencies at a given depth of the provided module location
 */
const getDependenciesAtGivenDepth = (outsideModuleChecker, filesMetadata) => {
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const dependenciesAtGivenDepthArray = [];
  const filesMapping = filesMetadata.filesMapping;
  for (const file in filesMapping) {
    if (
      // If the file is not excluded, satisfies dependency at a given depth condition, and is also reffered
      outsideModuleChecker.test(file) &&
      isFilePath(file) &&
      isFileNotExcluded(excludedFilesRegex, file)
    ) {
      dependenciesAtGivenDepthArray.push({
        file,
        filePoints: getFilePoints(file, filesMapping),
      });
    }
  }
  // If no errors found during traversal
  if (filesMetadata.unparsableVistedFiles === 0)
    process.send({
      text: "Successfully identified all dependencies at the provided depth",
      messageType: DISPLAY_TEXT,
    });
  else
    process.send({
      text: "Unable to identify few ddependencies at the provided depth",
      messageType: DISPLAY_TEXT,
    });

  return dependenciesAtGivenDepthArray;
};

/**
 * Will generate a mapping containing information related to dependency at a given depth and the files which import them
 * @param {Array} dependenciesAtGivenDepthArray Array containing the dependencies at a given depth
 * @param {Object} filesMetadata
 */
const getDependenciesAtGivenDepthUsageMapping = (
  dependenciesAtGivenDepthArray,
  filesMetadata
) => {
  const dependenciesUsageMapping = {};
  dependenciesAtGivenDepthArray.forEach(
    (fileObject) => (dependenciesUsageMapping[fileObject.file] = [])
  );
  for (const file in filesMetadata.filesMapping) {
    for (const dependentFile in filesMetadata.filesMapping[file]
      .staticImportFilesMapping) {
      if (dependenciesUsageMapping[dependentFile]) {
        dependenciesUsageMapping[dependentFile].push(file);
      }
    }
  }
  return dependenciesUsageMapping;
};

module.exports = {
  getDependenciesAtGivenDepth,
  getDependenciesAtGivenDepthUsageMapping,
};
