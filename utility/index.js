const {
  checkFileUsage,
  checkDeadFileImportsUsage,
} = require("../checker/file-usage-checker");
const {
  checkFileImportExports,
} = require("../checker/file-imports-exports-checker");
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
 * Sets each file's exported variable which will used later on during the CHECK_USAGE stage
 * @param {Array} allEntryFiles
 * @param {Object} filesMetadata
 * @param {Object} entryFilesMapping
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
  { moduleLocation, isDepthFromFront, depth },
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
    isDepthFromFront,
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
 * Will be used to retrieve all dead files present
 * Will recursively check whether a dead file's imported files are dead files too or not
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Array} allFilesToCheck Array consisting of all files we have to check to detect dead files
 * @returns Array of dead files
 */
const getAllDeadFiles = (filesMetadata, allFilesToCheck) => {
  const filesMapping = filesMetadata.filesMapping;
  const deadFilesArray = allFilesToCheck.filter((file) => {
    return (
      // Either file was never imported/ referred or if imported but never used
      !filesMapping[file] ||
      (filesMapping[file].isEntryFile === false &&
        !isFileReferred(filesMapping, file))
    );
  });
  const deadFileVisitedMapping = {};
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  for (const file of deadFilesArray) {
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
          deadFilesArray.push(importedFile);
        }
      }
    }
  }
  return deadFilesArray;
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
      console.log(referencesUsingThisFile);
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

const buildEntryFilesMappingFromArray = (entryFilesArray) => {
  const entryFilesMapping = {};
  entryFilesArray.forEach((file) => (entryFilesMapping[file] = true));
  return entryFilesMapping;
};
module.exports = {
  setAllStaticallyImportedFilesMapping,
  setAllFileExports,
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  buildEntryFilesMappingFromArray,
};
