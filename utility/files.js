const fs = require("fs");
const {
  resolveAddressWithProvidedDirectory,
  getPredecessorDirectory,
  isFilePath,
  getPathBaseName,
} = require("./resolver");
const {
  isInstanceofRegexExpression,
  isFileNotExcluded,
} = require("./conditional-expressions-checks");
const { getNewDefaultObject } = require("../ast/utility");

/**
 * Returns the default filesMetadata object
 * @param {RegExp} excludedFilesRegex Regex expression denoting excluded files
 * @returns Object containing all files' metadata
 */
const getDefaultFilesMetadata = (excludedFilesRegex) => {
  return {
    filesMapping: {},
    visitedFilesMapping: {},
    excludedFilesRegex,
    unparsableVistedFiles: 0,
  };
};
/**
 * Update existing filesMetdata with the help of currently parsed file's metdata
 * @param {Object} filesMetadata Metadata of all files parsed by the program
 * @param {Object} currentFileMetadata Metadata of the currently parsed file
 */
const updateFilesMetadata = (filesMetadata, currentFileMetadata) => {
  const filesMapping = filesMetadata.filesMapping;
  const currentFileMapping = currentFileMetadata.importedFilesMapping;
  filesMapping[currentFileMetadata.fileLocation].exportedVariables =
    currentFileMetadata.exportedVariables;
  filesMapping[currentFileMetadata.fileLocation].importedFilesMapping =
    currentFileMapping;
};

/**
 * Returns the default currentFileMetadata object
 * @param {String} fileLocation Address of the file whose metadata has to be returned
 * @returns Object containing current file's default metadata
 */
const getDefaultCurrentFileMetadata = (fileLocation) => {
  return {
    importedVariables: {},
    exportedVariables: {},
    importedFilesMapping: {},
    staticImportFilesMapping: {},
    fileLocation,
  };
};
/**
 * Returns an object which set's the default values corresponding to each file's object
 * @param {String} fileLocation Address of the file for which default object has to be created
 * @param {String} type Denotes whether it is a "FILE" or "UNRESOLVED_TYPE"
 * @returns Object consisting of default information related to that file
 */
const getDefaultFileObject = (fileLocation, type = "FILE") => {
  return {
    name: getPathBaseName(fileLocation),
    type,
    fileLocation: fileLocation,
    isEntryFile: false,
    exportedVariables: {
      default: getNewDefaultObject(fileLocation),
      // If the whole exportVaroables object is referred
      importReferenceCount: 0,
      referenceCount: 0,
    },
    staticImportFilesMapping: {},
    webpackChunkConfiguration: {},
    importedFilesMapping: {},
  };
};
/**
 * Get all entry files from the directories to check (provided in the configuration file)
 * @param {Array} entryArray Array of regex/ paths denoting which entry files are requied
 * @param {Array} allFilesToCheck All files inside the directories where the program will run
 * @param {RegExp} excludedFilesRegex Regex denoting excluded files
 * @returns Array consisting of all entry files
 */
const getAllEntryFiles = async (
  entryArray,
  allFilesToCheck,
  excludedFilesRegex
) => {
  // Mapping required to remove redundant traversal of directories
  const visitedEntryDirectoriesMapping = {};
  const entryFilesArray = [];
  for (const entry of entryArray) {
    if (isInstanceofRegexExpression(entry)) {
      allFilesToCheck.forEach((file) => {
        // if a file matches the regex and also is not excluded
        if (entry.test(file) && isFileNotExcluded(excludedFilesRegex, file)) {
          entryFilesArray.push(file);
        }
      });
    } else {
      // getAllFiles will return all non-excluded files from the "entry" directory
      const filesInsideThisDirectory =
        await getAllFilesInsideProvidedDirectories(
          [entry],
          visitedEntryDirectoriesMapping,
          excludedFilesRegex
        );
      // Simply using deconstructor to add these files inside the array may result in memory overflow
      filesInsideThisDirectory.forEach((file) => entryFilesArray.push(file));
    }
  }
  return entryFilesArray;
};

/**
 * Get all feasible files present in any one of the directories which are provided
 * @param {Array} directoriesToCheck Array of directories from which all files will be extracted
 * @param {RegExp} excludedFilesRegex Regex denoting excluded files
 * @returns Array of feasible files present in any one of the directories which have to be checked
 */
const getAllFilesToCheck = async (directoriesToCheck, excludedFilesRegex) => {
  // Mapping required to remove redundant traversal of directories
  const visitedDirectoriesToCheckMapping = {};
  return await getAllFilesInsideProvidedDirectories(
    directoriesToCheck,
    visitedDirectoriesToCheckMapping,
    excludedFilesRegex
  );
};

/**
 * Returns all feasible files present inside the provided directories
 * @param {Array} allDirectories Array of directories to check
 * @param {Object} visitedDirectoriesMapping Mapping to remove redundant traversal of directories
 * @param {RegExp} excludedFilesRegex Regex denoting excluded files
 * @returns Array of feasible files present in any one of the provided directories
 */
const getAllFilesInsideProvidedDirectories = async (
  allDirectories,
  visitedDirectoriesMapping,
  excludedFilesRegex
) => {
  const allFiles = [];
  for (const directory of allDirectories) {
    const directoyAbsoluteAddress = resolveAddressWithProvidedDirectory(
      // This directory is inside utility, so get it's parent directory according to which paths were provided in the configuration file
      getPredecessorDirectory(__dirname, 1),
      directory
    );
    if (isFilePath(directoyAbsoluteAddress)) {
      if (isFileNotExcluded(excludedFilesRegex, directoyAbsoluteAddress))
        allFiles.push(directoyAbsoluteAddress);
      continue;
    }

    const directoriesFiles = await getAllFilesInsideOneDirectory(
      directoyAbsoluteAddress,
      visitedDirectoriesMapping,
      excludedFilesRegex
    );
    directoriesFiles.forEach((file) => {
      allFiles.push(file);
    });
  }
  return allFiles;
};

/**
 * Returns all feasible files present inside a directory
 * @param {String} directoryLocation Path of the given directory
 * @param {Object} visitedDirectoriesMapping Mapping to keep track of visited locations
 * @param {RegExp} excludedFilesRegex Regex denoting excluded files
 * @returns Array of feasible files present inside the provided directory
 */
const getAllFilesInsideOneDirectory = async (
  directoryLocation,
  visitedDirectoriesMapping,
  excludedFilesRegex
) => {
  if (
    visitedDirectoriesMapping[directoryLocation] ||
    excludedFilesRegex.test(directoryLocation)
  )
    return [];
  // If not excluded then mark this location as visited, to remove redundant traversals of this location
  visitedDirectoriesMapping[directoryLocation] = true;
  const allFilesAndDirectoriesInsideThisDirectory = await fs.promises.readdir(
    directoryLocation,
    {
      withFileTypes: true,
    }
  );
  const allFiles = [];
  for (const file of allFilesAndDirectoriesInsideThisDirectory) {
    if (file.isDirectory()) {
      // location is a directory
      const filesInsideThisSubDirectory = await getAllFilesInsideOneDirectory(
        resolveAddressWithProvidedDirectory(directoryLocation, file.name),
        visitedDirectoriesMapping,
        excludedFilesRegex
      );
      filesInsideThisSubDirectory.forEach((file) => allFiles.push(file));
    } else {
      // location is a file
      const fileLocation = resolveAddressWithProvidedDirectory(
        directoryLocation,
        file.name
      );
      if (isFileNotExcluded(excludedFilesRegex, fileLocation))
        allFiles.push(fileLocation);
    }
  }
  return allFiles;
};

module.exports = {
  getDefaultFilesMetadata,
  updateFilesMetadata,
  getDefaultFileObject,
  getDefaultCurrentFileMetadata,
  getAllEntryFiles,
  getAllFilesToCheck,
};
