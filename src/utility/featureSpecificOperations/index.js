const {
  getDeadFilesAndSendMessageToParent,
  analyseCode,
  setAllFileExports,
  buildEntryFilesMappingFromArray,
} = require("./deadFile");
const {
  getDependenciesAtGivenDepth,
  getDependenciesAtGivenDepthUsageMapping,
} = require("./dependenciesAtGivenDepth");
const { getAllRequiredFiles, setImportedFilesMapping } = require("./common");
const {
  createWebpackChunkMetadata,
  getFilesContributingInMultipleChunks,
  getFilesContributingInMultipleChunksMapping,
} = require("./filesContributingInMultipleChunks");
const getAllDependentFiles = require("./chunkMetadataOfAGivenFile");

module.exports = {
  getDeadFilesAndSendMessageToParent,
  analyseCode,
  setAllFileExports,
  buildEntryFilesMappingFromArray,
  getDependenciesAtGivenDepth,
  getDependenciesAtGivenDepthUsageMapping,
  getAllRequiredFiles,
  setImportedFilesMapping,
  createWebpackChunkMetadata,
  getFilesContributingInMultipleChunks,
  getFilesContributingInMultipleChunksMapping,
  getAllDependentFiles,
};
