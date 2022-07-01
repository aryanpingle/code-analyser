import {
  DISPLAY_TEXT,
  CHUNKS,
  ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE,
} from "../constants.js";
import { isFileNotExcluded } from "../helper.js";

/**
 * Will be used to create a new Data Structure which will contain information of each file and the chunks inside which it is present
 * @param {Object} filesMetadata Contains information related to all files
 * @returns Data Structure containing mapping of file and it's dependencies and the chunks inside which it is present
 */
export const createWebpackChunkMetadata = (filesMetadata) => {
  const allFilesChunksMetadata = {};
  const filesMapping = filesMetadata.filesMapping;
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  Object.entries(filesMapping).forEach(([fileName, fileObject]) => {
    if (!isFileNotExcluded(excludedFilesRegex, fileName)) return;
    if (!allFilesChunksMetadata[fileName])
      allFilesChunksMetadata[fileName] = generateDefaultFileChunksObject(
        filesMetadata,
        fileName
      );
    Object.keys(fileObject.webpackChunkConfiguration).forEach((chunkName) =>
      allFilesChunksMetadata[fileName].chunks.push(chunkName)
    );

    Object.keys(fileObject.staticImportFilesMapping).forEach((importedFile) => {
      if (!isFileNotExcluded(excludedFilesRegex, importedFile)) return;
      if (!allFilesChunksMetadata[importedFile])
        allFilesChunksMetadata[importedFile] = generateDefaultFileChunksObject(
          filesMetadata,
          importedFile
        );
      allFilesChunksMetadata[importedFile][fileName] =
        allFilesChunksMetadata[fileName];
    });
  });
  process.send({
    text: ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE,
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
export const getFilesContributingInMultipleChunks = (webpackChunkMetadata) => {
  const fileWebpackChunkMapping = {};
  const filesInMultipleChunksDetails = [];
  Object.keys(webpackChunkMetadata).forEach((file) => {
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
  });
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
  Object.keys(webpackChunkMetadata[fileLocation]).forEach((dependentFile) => {
    if (dependentFile === CHUNKS) return;
    if (fileWebpackChunkMapping[dependentFile]) {
      if (fileWebpackChunkMapping[dependentFile].size)
        fileWebpackChunkMapping[dependentFile].forEach((dependentChunk) =>
          fileChunksSet.add(dependentChunk)
        );
      return;
    }
    const dependentFileChunksSet = getAllRelatedChunks(
      dependentFile,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (dependentFileChunksSet.size)
      dependentFileChunksSet.forEach((dependentChunk) =>
        fileChunksSet.add(dependentChunk)
      );
  });
  fileWebpackChunkMapping[fileLocation] = fileChunksSet;
  return fileChunksSet;
};

/**
 * Generates a mapping from given array containing files which are present in multiple chunks
 * @param {Array} filesInMultipleChunksArray
 */
export const getFilesContributingInMultipleChunksMapping = (
  filesInMultipleChunksArray
) => {
  const filesInMultipleChunksMapping = {};
  filesInMultipleChunksArray.forEach((fileObject) => {
    filesInMultipleChunksMapping[fileObject.file] = fileObject.chunksArray;
  });
  return filesInMultipleChunksMapping;
};
