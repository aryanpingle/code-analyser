const programConfiguration = require("./code-analyser.config.js");
const { buildExcludedFilesRegex } = require("./utility/regex");
const { resolveAddressWithProvidedDirectory } = require("./utility/resolver");
const { createNewCliSpinner } = require("./utility/cli");
const { getDefaultFilesMetadata } = require("./utility/files");
const {
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  setAllImportsAndExportsOfEachFile,
} = require("./utility/index");
const {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
} = require("./utility/conditional-expressions-checks");

const excludedFilesRegex = buildExcludedFilesRegex(
  programConfiguration.exclude
);

/**
 * Function which first analyses the code and prints the dead files present on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 * @param {RegExp} excludedFilesRegex Regex of excluded files
 */
const analyseCodeAndDetectDeadfiles = async (
  filesMetadata,
  programConfiguration,
  excludedFilesRegex
) => {
  const spinner = createNewCliSpinner();
  const { allEntryFiles, allFilesToCheck } = await getAllRequiredFiles(
    {
      directoriesToCheck: programConfiguration.directoriesToCheck,
      entry: programConfiguration.deadFiles.entry,
    },
    excludedFilesRegex,
    spinner
  );
  const traversalRelatedMetadata = {
    allEntryFiles,
    traverseType: "DEADFILE_FINDER_TRAVERSE",
  };

  setAllImportsAndExportsOfEachFile(traversalRelatedMetadata, filesMetadata);
  // Will re-itearte the code, so set the visited files mapping as empty
  filesMetadata.visitedFilesMapping = {};
  analyseCode(traversalRelatedMetadata, filesMetadata, spinner);
  const allDeadFiles = getDeadFiles(allFilesToCheck, filesMetadata, spinner);
  console.log(allDeadFiles);
};

/**
 * Function which first analyses the code and prints the intra-module dependencies present on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 * @param {RegExp} excludedFilesRegex Regex of excluded files
 */
const analyseCodeAndDetectIntraModuleDependencies = async (
  filesMetadata,
  programConfiguration,
  excludedFilesRegex
) => {
  const spinner = createNewCliSpinner();
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: [
        programConfiguration.intraModuleDependencies.moduleToCheck,
      ],
      entry: programConfiguration.intraModuleDependencies.entry,
    },
    excludedFilesRegex,
    spinner
  );
  const traversalRelatedMetadata = {
    allEntryFiles,
    traverseType: "INTRA_MODULE_DEPENDENCY_TRAVERSE",
  };

  setAllImportsAndExportsOfEachFile(traversalRelatedMetadata, filesMetadata);
  // Will re-itearte the code, so set the visited files mapping as empty
  filesMetadata.visitedFilesMapping = {};
  analyseCode(traversalRelatedMetadata, filesMetadata, spinner);
  const dependencyCheckerRelatedMetadata = {
    moduleLocation: resolveAddressWithProvidedDirectory(
      __dirname,
      programConfiguration.intraModuleDependencies.moduleToCheck
    ),
    depth: programConfiguration.intraModuleDependencies.depth,
  };
  const intraModuleDependencies = getIntraModuleDependencies(
    dependencyCheckerRelatedMetadata,
    filesMetadata,
    spinner
  );
  console.log(intraModuleDependencies);
};

if (isDeadfileCheckRequired(programConfiguration)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectDeadfiles(
    filesMetadata,
    programConfiguration,
    excludedFilesRegex
  );
}

if (isIntraModuleDependenciesCheckRequired(programConfiguration)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectIntraModuleDependencies(
    filesMetadata,
    programConfiguration,
    excludedFilesRegex
  );
}
