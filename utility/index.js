const {
  checkFileUsage,
} = require("../checker/file-usage-checker");
const {
  checkFileStaticImport,
} = require("../checker/file-static-imports-checker");
const { getAllEntryFiles, getAllFilesToCheck } = require("./files");
const { addNewInstanceToSpinner, updateSpinnerInstance } = require("./cli");
const { buildIntraModuleDependencyRegex } = require("./regex");
const { isFilePath } = require("./resolver");
const { isFileNotExcluded } = require("./conditional-expressions-checks");

/**
 * Used to get all statically imported files addresses on which the entry files depend
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 */
const setAllStaticallyImportedFilesMapping = (allEntryFiles, filesMetadata) => {
  allEntryFiles.forEach((file) => {
    checkFileStaticImport(file, filesMetadata);
  });
};

/**
 * Analyses the code and updates the references of parsed files
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} spinner Spinner container contaning multiple spinner instances
 */
const analyseCode = (
  allEntryFiles,
  filesMetadata,
  spinner
) => {
  addNewInstanceToSpinner(spinner, "id3", "Analysing codebase...");
  allEntryFiles.forEach((entryFile) =>
    checkFileUsage(entryFile, filesMetadata)
  );
  updateSpinnerInstance(spinner, "id3", {
    text: "Analysed code base",
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
  const filesMapping = filesMetadata.filesMapping;
  const allDeadFiles = allFilesToCheck.filter((file) => {
    return (
      // Either file was never imported/ referred or if imported but never used
      !filesMapping[file] ||
      (filesMapping[file].isEntryFile === false &&
        !isFileReferred(filesMapping, file))
    );
  });
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
  { moduleLocation, depth },
  filesMetadata,
  spinner
) => {
  addNewInstanceToSpinner(
    spinner,
    "id5",
    "Identifying intra-module dependencies..."
  );
  const intraModuleDependencyRegex = buildIntraModuleDependencyRegex(
    moduleLocation,
    depth
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
      intraModuleDependenciesArray.push(file);
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
 * Checks if a file is not a dead file and was actually used by some other file
 * @param {Object} filesMapping Contains information related to all files
 * @param {*} fileLocation Address of the file which has to be check
 * @returns Boolean value denoting whether this file was referred or not
 */
const isFileReferred = (filesMapping, fileLocation) => {
  let isReferred = false;
  if (!filesMapping[fileLocation]) return false;
  const allExportedVariables = filesMapping[fileLocation].exportedVariables;
  try {
    // If the entire object of the file was referred
    if (
      allExportedVariables.referenceCount >
      allExportedVariables.importReferenceCount
    ) {
      isReferred = true;
    }
  } catch (_) {}
  for (const variable in allExportedVariables) {
    try {
      if (
        allExportedVariables[variable].referenceCount >
        allExportedVariables[variable].importReferenceCount
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

module.exports = {
  setAllStaticallyImportedFilesMapping,
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
};
