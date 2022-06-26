const { checkFileImports } = require("../../checker/fileImports");
const { DISPLAY_TEXT } = require("../constants");
const { getAllFilesToCheck, getAllEntryFiles } = require("../files");
const { isFileExtensionValid } = require("../helper");
const { getNumberOfSubPartsOfGivenAbsolutePath } = require("../resolver");

/**
 * Will be used to get all the files which are imported
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} traverseMetadata To decide whether check static imports only, check file size etc...
 */
const setImportedFilesMapping = (
  allEntryFiles,
  filesMetadata,
  traverseMetadata
) => {
  allEntryFiles.forEach((file) => {
    checkFileImports(file, filesMetadata, traverseMetadata);
  });
};

/**
 * Used to determine the significance of a particular file
 * @param {String} file Absolute address of a file
 * @param {Object} filesMapping Contains information related to all files
 * @returns Points associated with the provided file
 */
const getFilePoints = (file, filesMapping) => {
  let filePoints = 0;
  if (isFileExtensionValid(file)) filePoints += 100;
  // If never referred
  if (!filesMapping[file]) filePoints += 10;
  // If present deep inside a parent folder, then it's significance is lower as compared to those present closer to a parent folder
  filePoints -= getNumberOfSubPartsOfGivenAbsolutePath(file);
  return filePoints;
};

/**
 * Used to get all files required by the program
 * @param {Object} programConfiguration Contains information related to which directories, entry files have to be retrieved
 * @param {RegExp} excludedFilesRegex Regex denoting the excluded files
 * @returns Object consisting of arrays of entry files and the files to check
 */
const getAllRequiredFiles = async (
  programConfiguration,
  excludedFilesRegex
) => {
  const allFilesToCheck = await getAllFilesToCheck(
    programConfiguration.directoriesToCheck,
    excludedFilesRegex
  );
  process.send({
    text: "Successfully retrieved all files inside the directories to check",
    messageType: DISPLAY_TEXT,
  });

  const allEntryFiles = await getAllEntryFiles(
    programConfiguration.entry,
    allFilesToCheck,
    excludedFilesRegex
  );
  process.send({
    text: "Successfully retrieved all entry files",
    messageType: DISPLAY_TEXT,
  });

  return { allEntryFiles, allFilesToCheck };
};

module.exports = {
  setImportedFilesMapping,
  getFilePoints,
  getAllRequiredFiles,
};
