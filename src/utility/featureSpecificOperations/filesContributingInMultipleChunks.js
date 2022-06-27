const { DISPLAY_TEXT, CHUNKS } = require("../constants");
const { isFileNotExcluded } = require("../helper");

/**
 * Will be used to create a new Data Structure which will contain information of each file and the chunks inside which it is present
 * @param {Object} filesMetadata Contains information related to all files
 * @returns Data Structure containing mapping of file and it's dependencies and the chunks inside which it is present
 */
const createWebpackChunkMetadata = (filesMetadata) => {
  const allFilesChunksMetadata = {};
  const filesMapping = filesMetadata.filesMapping;
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  for (const file in filesMapping) {
    if (!isFileNotExcluded(excludedFilesRegex, file)) continue;
    if (!allFilesChunksMetadata[file]) {
      allFilesChunksMetadata[file] = generateDefaultFileChunksObject(
        filesMetadata,
        file
      );
    }
    for (const chunkName in filesMapping[file].webpackChunkConfiguration) {
      allFilesChunksMetadata[file].chunks.push(chunkName);
    }
    for (const importedFile in filesMapping[file].staticImportFilesMapping) {
      if (!isFileNotExcluded(excludedFilesRegex, importedFile)) continue;
      if (!allFilesChunksMetadata[importedFile])
        allFilesChunksMetadata[importedFile] = generateDefaultFileChunksObject(
          filesMetadata,
          importedFile
        );
      allFilesChunksMetadata[importedFile][file] = allFilesChunksMetadata[file];
    }
  }
  process.send({
    text: "Established relationship between different files",
    messageType: DISPLAY_TEXT,
  });

  return allFilesChunksMetadata;
};

/**
 * Used to create a new object which will contain the chunks inside which this file is present initially
 * @param {Object} filesMetadata Contains information related to all files
 * @param {String} fileLocation Absolute address of the file to check
 * @returns Object containing an array of initial chunks inside which the given file is present
 */
const generateDefaultFileChunksObject = (filesMetadata, fileLocation) => {
  const defaultObject = { chunks: [] };
  if (filesMetadata.filesMapping[fileLocation].isEntryFile) {
    defaultObject.chunks.push(fileLocation);
  }
  return defaultObject;
};

/**
 * Displays the files (along with the chunks inside which it is present) which are present in more than one chunk on the console
 * @param {Object} webpackChunkMetadata Data Structure containing information related to the chunks inside which a file is present
 */
const getFilesContributingInMultipleChunks = (webpackChunkMetadata) => {
  const fileWebpackChunkMapping = {};
  const filesInMultipleChunksDetails = [];
  for (const file in webpackChunkMetadata) {
    const fileChunksSet = getAllRelatedChunks(
      file,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (fileChunksSet.size > 1) {
      filesInMultipleChunksDetails.push({
        file,
        chunksArray: Array.from(fileChunksSet),
      });
    }
  }
  return filesInMultipleChunksDetails;
};

/**
 * Used to get all the chunks inside which a given file is present, will use DFS along with memoization to retrieve the information
 * @param {String} fileLocation Absolute address of the file to check
 * @param {Object} webpackChunkMetadata Data Structure containing information related to the chunks inside which a file is present
 * @param {Object} fileWebpackChunkMapping Mapping to check whether all the chunks inside which a file is present have been retrieved
 * @returns Set of chunks inside which the given file is present
 */
const getAllRelatedChunks = (
  fileLocation,
  webpackChunkMetadata,
  fileWebpackChunkMapping
) => {
  if (fileWebpackChunkMapping[fileLocation])
    return fileWebpackChunkMapping[fileLocation];
  const fileChunksSet = new Set(webpackChunkMetadata[fileLocation].chunks);
  fileWebpackChunkMapping[fileLocation] = fileChunksSet;
  for (const dependentFile in webpackChunkMetadata[fileLocation]) {
    if (dependentFile === CHUNKS) continue;
    if (fileWebpackChunkMapping[dependentFile]) {
      if (fileWebpackChunkMapping[dependentFile].size) {
        for (const dependentChunk of fileWebpackChunkMapping[dependentFile])
          fileChunksSet.add(dependentChunk);
      }
      continue;
    }
    const dependentFileChunksSet = getAllRelatedChunks(
      dependentFile,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (dependentFileChunksSet.size) {
      for (const dependentChunk of dependentFileChunksSet)
        fileChunksSet.add(dependentChunk);
    }
  }
  fileWebpackChunkMapping[fileLocation] = fileChunksSet;
  return fileChunksSet;
};

/**
 * Generates a mapping from given array containing files which are present in multiple chunks
 * @param {Array} filesInMultipleChunksArray
 */
const getFilesContributingInMultipleChunksMapping = (filesInMultipleChunksArray) => {
  const filesInMultipleChunksMapping = {};
  filesInMultipleChunksArray.forEach((fileObject) => {
    filesInMultipleChunksMapping[fileObject.file] = fileObject.chunksArray;
  });
  return filesInMultipleChunksMapping;
};

module.exports = {
  createWebpackChunkMetadata,
  getFilesContributingInMultipleChunks,
  getFilesContributingInMultipleChunksMapping,
};
