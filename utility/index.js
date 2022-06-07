const { checkUsingEntryFile } = require("../checker/entry-file-checker");
const {
  checkFileImportsExports,
} = require("../checker/file-imports-exports-checker");
const { getAllEntryFiles, getAllFilesToCheck } = require("./files");
const { addNewInstanceToSpinner, updateSpinnerInstance } = require("./cli");
const { buildIntraModuleDependencyRegex } = require("./regex");
const { isFilePath } = require("./resolver");

const analyseCode = (allEntryFiles, filesMetadata, spinner, traverseType) => {
  addNewInstanceToSpinner(spinner, "id3", "Analysing codebase...");
  allEntryFiles.forEach((entryFile) =>
    checkUsingEntryFile(entryFile, filesMetadata, traverseType)
  );
  updateSpinnerInstance(spinner, "id3", {
    text: "Analysed code base",
    status: "succeed",
  });
};

const getDeadFiles = (allFilesToCheck, filesMetadata, spinner) => {
  addNewInstanceToSpinner(
    spinner,
    "id4",
    "Identifying all deadfiles inside the directories to check..."
  );
  const allDeadFiles = allFilesToCheck.filter((file) => {
    let isReferred = false;
    if (filesMetadata.filesMapping[file]) {
      const allExportedVariables =
        filesMetadata.filesMapping[file].exportedVariables;
      try {
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
    }
    return (
      (filesMetadata.filesMapping[file] &&
        filesMetadata.filesMapping[file].isEntryFile === false &&
        !isReferred) ||
      !filesMetadata.filesMapping[file]
    );
  });
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

const getIntraModuleDependencies = (
  filesMetadata,
  moduleLocation,
  spinner,
  depth
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
  const excludedPointsRegex = filesMetadata.excludedPointsRegex;

  const intraModuleImports = [];
  const filesMapping = filesMetadata.filesMapping;
  for (const file in filesMapping) {
    if (
      intraModuleDependencyRegex.test(file) &&
      isFilePath(file) &&
      !excludedPointsRegex.test(file)
    ) {
      intraModuleImports.push(file);
    }
  }
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
  return intraModuleImports;
};

const getAllRequiredFiles = async (config, excludedPointsRegex, spinner) => {
  addNewInstanceToSpinner(
    spinner,
    "id1",
    "Retrieving all files inside directories to check..."
  );
  const allFilesToCheck = await getAllFilesToCheck(
    config.directoriesToCheck,
    excludedPointsRegex
  );
  updateSpinnerInstance(spinner, "id1", {
    text: "Successfully retrieved all files inside the directories to check",
    status: "succeed",
  });
  addNewInstanceToSpinner(spinner, "id2", "Retrieving entry files...");
  const allEntryFiles = await getAllEntryFiles(
    config.entry,
    allFilesToCheck,
    excludedPointsRegex
  );
  updateSpinnerInstance(spinner, "id2", {
    text: "Successfully retrieved all entry files",
    status: "succeed",
  });

  return { allEntryFiles, allFilesToCheck };
};

const getAllImportsAndExportsOfEachFile = (
  allEntryFiles,
  filesMetadata,
  traverseType
) => {
  allEntryFiles.forEach((file) => {
    checkFileImportsExports(file, filesMetadata, traverseType);
  });
};

module.exports = {
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  getAllImportsAndExportsOfEachFile,
};
