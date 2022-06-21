const {
  checkFileUsage,
  checkDeadFileImportsUsage,
} = require("../checker/file-usage");
const { checkFileImportExports } = require("../checker/file-imports-exports");
const { checkFileImports } = require("../checker/file-imports");
const { getAllEntryFiles, getAllFilesToCheck } = require("./files");
const {
  addNewInstanceToSpinner,
  updateSpinnerInstance,
  displayDuplicateFileDetails,
} = require("./cli");
const {
  isFilePath,
  getNumberOfSubPartsOfGivenAbsolutePath,
} = require("./resolver");
const { isFileNotExcluded, isFileExtensionValid } = require("./helper");
const { CHUNKS } = require("./constants");

/**
 * Used to get all the statically imported files addresses on which the entry files depend
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 */
const setAllStaticallyImportedFilesMapping = (allEntryFiles, filesMetadata) => {
  allEntryFiles.forEach((file) => {
    checkFileImports(file, filesMetadata, true);
  });
};

/**
 * Used to get all the imported files addresses on which the entry files depend
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 */
const setAllImportedFilesMapping = (allEntryFiles, filesMetadata) => {
  allEntryFiles.forEach((file) => {
    checkFileImports(file, filesMetadata, false);
  });
};

/**
 * Sets each file's exported variables which will be used later on during the CHECK_USAGE stage
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} entryFilesMapping Mapping to check whether a file is an entry file or not
 */
const setAllFileExports = (allEntryFiles, filesMetadata, entryFilesMapping) => {
  allEntryFiles.forEach((entryFile) =>
    checkFileImportExports(entryFile, filesMetadata, entryFilesMapping)
  );
};

/**
 * Analyses the code and updates the references of parsed files
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} spinner Spinner container contaning multiple spinner instances
 */
const analyseCode = (allEntryFiles, filesMetadata, spinner) => {
  addNewInstanceToSpinner(spinner, "id3", "Analysing codebase...");
  allEntryFiles.forEach((entryFile) =>
    checkFileUsage(entryFile, filesMetadata)
  );
  updateSpinnerInstance(spinner, "id3", {
    text: "Analysed the codebase",
    status: "succeed",
  });
};

/**
 * Used to find dead files present in the feasible array of files provided
 * @param {Array} allFilesToCheck Array of feasible files which have to be checked for dead files
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} spinner Spinner container containing multiple spinner instances
 * @returns Array of dead files found inside the allFilesToCheck array
 */
const getDeadFiles = (allFilesToCheck, filesMetadata, spinner) => {
  addNewInstanceToSpinner(
    spinner,
    "id4",
    "Identifying all deadfiles inside the directories to check..."
  );
  const allDeadFiles = getAllDeadFiles(filesMetadata, allFilesToCheck);
  // If no errors were found while parsing these files
  if (filesMetadata.unparsableVistedFiles === 0)
    updateSpinnerInstance(spinner, "id4", {
      text: "Successfully identified all dead files",
      status: "succeed",
    });
  else {
    updateSpinnerInstance(spinner, "id4", {
      text: "Unable to identify few dead files",
      color: "yellow",
      status: "stopped",
    });
  }
  return allDeadFiles;
};

/**
 * Checks for all intra-module dependencies which were actually referred by any file
 * @param {Object} dependencyCheckerRelatedMetadata Contains information required by this function like location of the entry file and depth variable
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} spinner Spinner container containing multiple spinner instances
 * @returns Array of files which are intra-module dependencies of the provided module location and depth
 */
const getIntraModuleDependencies = (
  { moduleLocation, isDepthFromFront, depth, intraModuleDependencyRegex },
  filesMetadata,
  spinner
) => {
  addNewInstanceToSpinner(
    spinner,
    "id5",
    "Identifying intra-module dependencies..."
  );
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const intraModuleDependenciesArray = [];
  const filesMapping = filesMetadata.filesMapping;
  for (const file in filesMapping) {
    if (
      // If the file is not excluded, satisfies intra-module dependency condition, and is also reffered
      intraModuleDependencyRegex.test(file) &&
      isFilePath(file) &&
      isFileNotExcluded(excludedFilesRegex, file)
    ) {
      intraModuleDependenciesArray.push({
        file,
        filePoints: getFilePoints(file, filesMapping),
      });
    }
  }
  // If no errors found during traversal
  if (filesMetadata.unparsableVistedFiles === 0)
    updateSpinnerInstance(spinner, "id5", {
      text: "Successfully identified all intra module dependencies",
      status: "succeed",
    });
  else {
    updateSpinnerInstance(spinner, "id5", {
      text: "Unable to identify few intra module dependencies",
      color: "yellow",
      status: "stopped",
    });
  }
  return intraModuleDependenciesArray;
};

/**
 * Will be used to retrieve all dead files present
 * Will recursively check whether a dead file's imported files are dead files too or not
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Array} allFilesToCheck Array consisting of all files we have to check to detect dead files
 * @returns Array of dead files
 */
const getAllDeadFiles = (filesMetadata, allFilesToCheck) => {
  const filesMapping = filesMetadata.filesMapping;
  const deadFilesArray = allFilesToCheck
    .filter((file) => {
      return (
        // Either file was never imported/ referred or if imported but never used
        !filesMapping[file] ||
        (filesMapping[file].isEntryFile === false &&
          !isFileReferred(filesMapping, file))
      );
    })
    .map((file) => {
      return { file, filePoints: getFilePoints(file, filesMapping) };
    });

  const deadFileVisitedMapping = {};
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  for (const fileObject of deadFilesArray) {
    const file = fileObject.file;
    deadFileVisitedMapping[file] = true;
    if (filesMapping[file]) {
      // Will be used to check whether imports of a dead file where referred inside this file only, if so then they will also become dead file now
      checkDeadFileImportsUsage(file, filesMetadata);
      for (const importedFile in filesMapping[file].importedFilesMapping) {
        if (
          // First we haven't checked that file
          !deadFileVisitedMapping[importedFile] &&
          // File isn't excluded
          isFileNotExcluded(excludedFilesRegex, importedFile) &&
          // And it is a dead file too
          (!filesMapping[importedFile] ||
            (filesMapping[importedFile].isEntryFile === false &&
              !isFileReferred(filesMapping, importedFile)))
        ) {
          deadFileVisitedMapping[importedFile] = true;
          deadFilesArray.push({
            file: importedFile,
            filePoints: getFilePoints(importedFile, filesMapping),
          });
        }
      }
    }
  }
  return deadFilesArray;
};

/**
 * Can be used to determine the significance of a particular file
 * @param {String} file Absolute address of a file
 * @param {Object} filesMapping Contains information related to all files
 * @returns Points associated with the provided file
 */
const getFilePoints = (file, filesMapping) => {
  let filePoints = 0;
  if (isFileExtensionValid(file)) filePoints += 100;
  if (!filesMapping[file]) filePoints += 10;
  filePoints -= getNumberOfSubPartsOfGivenAbsolutePath(file);
  return filePoints;
};

/**
 * Checks if a file is not a dead file and was actually used by some other file
 * @param {Object} filesMapping Contains information related to all files
 * @param {String} fileLocation Address of the file which has to be check
 * @returns Boolean value denoting whether this file was referred or not
 */
const isFileReferred = (filesMapping, fileLocation) => {
  let isReferred = false;
  if (!filesMapping[fileLocation]) return false;
  const allExportedVariables = filesMapping[fileLocation].exportedVariables;
  try {
    // If the entire object of the file was referred
    let referencesUsingThisFile = allExportedVariables.referenceCount;
    if (
      allExportedVariables.individualFileReferencesMapping &&
      allExportedVariables.individualFileReferencesMapping[fileLocation]
    ) {
      referencesUsingThisFile -=
        allExportedVariables.individualFileReferencesMapping[fileLocation]
          .referenceCount -
        allExportedVariables.individualFileReferencesMapping[fileLocation]
          .exportReferenceCount;
    }
    if (referencesUsingThisFile || allExportedVariables.isEntryFileObject) {
      isReferred = true;
    }
  } catch (_) {}
  if (isReferred) return true;
  for (const variable in allExportedVariables) {
    try {
      let referencesUsingThisFile =
        allExportedVariables[variable].referenceCount;
      if (
        allExportedVariables[variable].individualFileReferencesMapping &&
        allExportedVariables[variable].individualFileReferencesMapping[
          fileLocation
        ]
      ) {
        const exportedVariablesReferencesInsideThisFile =
          allExportedVariables[variable].individualFileReferencesMapping[
            fileLocation
          ];
        referencesUsingThisFile -=
          exportedVariablesReferencesInsideThisFile.referenceCount -
          exportedVariablesReferencesInsideThisFile.exportReferenceCount;
      }
      if (
        referencesUsingThisFile ||
        allExportedVariables[variable].isEntryFileObject
      ) {
        isReferred = true;
        break;
      }
    } catch (_) {}
  }
  return isReferred;
};

/**
 * Used to get all files (entry files, files which have to be checked for intra-module dependency/ deadfile)
 * @param {Object} programConfiguration Contains information related to which directories, entry files have to be retrieved
 * @param {RegExp} excludedFilesRegex Regex denoting the excluded files
 * @param {Object} spinner Spinner container containing multiple spinner instances
 * @returns Object consisting of arrays of entry files and the files to check
 */
const getAllRequiredFiles = async (
  programConfiguration,
  excludedFilesRegex,
  spinner
) => {
  addNewInstanceToSpinner(
    spinner,
    "id1",
    "Retrieving all files inside directories to check..."
  );
  const allFilesToCheck = await getAllFilesToCheck(
    programConfiguration.directoriesToCheck,
    excludedFilesRegex
  );
  updateSpinnerInstance(spinner, "id1", {
    text: "Successfully retrieved all files inside the directories to check",
    status: "succeed",
  });
  addNewInstanceToSpinner(spinner, "id2", "Retrieving entry files...");
  const allEntryFiles = await getAllEntryFiles(
    programConfiguration.entry,
    allFilesToCheck,
    excludedFilesRegex
  );
  updateSpinnerInstance(spinner, "id2", {
    text: "Successfully retrieved all entry files",
    status: "succeed",
  });

  return { allEntryFiles, allFilesToCheck };
};

/**
 * Will be used to create a new Data Structure which will contain information of each file and the chunks inside which it is present
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} spinner Spinner container containing multiple spinner instances
 * @returns Data Structure containing mapping of file and it's dependencies and the chunks inside which it is present
 */
const createWebpackChunkMetadata = (filesMetadata, spinner) => {
  addNewInstanceToSpinner(
    spinner,
    "id3",
    "Establishing relationship between different files..."
  );
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
  updateSpinnerInstance(spinner, "id3", {
    text: "Established relationship between different files",
    status: "succeed",
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
const displayDuplicateFiles = (webpackChunkMetadata) => {
  const fileWebpackChunkMapping = {};
  for (const file in webpackChunkMetadata) {
    const fileChunksSet = getAllRelatedChunks(
      file,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (fileChunksSet.size > 1) {
      displayDuplicateFileDetails(file, Array.from(fileChunksSet));
    }
  }
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
      if (fileWebpackChunkMapping[dependentFile].size)
        fileChunksSet.add(...fileWebpackChunkMapping[dependentFile]);
      continue;
    }
    const dependentFileChunksSet = getAllRelatedChunks(
      dependentFile,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (dependentFileChunksSet.size)
      fileChunksSet.add(...dependentFileChunksSet);
  }
  fileWebpackChunkMapping[fileLocation] = fileChunksSet;
  return fileChunksSet;
};

/**
 * Used to check whether a file is an entry file or not
 * @param {Array} entryFilesArray Array of entry files
 * @returns Mapping of files
 */
const buildEntryFilesMappingFromArray = (entryFilesArray) => {
  const entryFilesMapping = {};
  entryFilesArray.forEach((file) => (entryFilesMapping[file] = true));
  return entryFilesMapping;
};

module.exports = {
  setAllStaticallyImportedFilesMapping,
  setAllImportedFilesMapping,
  setAllFileExports,
  createWebpackChunkMetadata,
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  displayDuplicateFiles,
  buildEntryFilesMappingFromArray,
};
