#!/usr/bin/env node
const process = require("process");
const {
  createNewCliSpinner,
  setConfiguration,
  produceAnalysdDeadFileResult,
  produceAnalysedIntraModuleDependenciesResult,
  displayFilesOnScreen,
} = require("./utility/cli");
const codeAnalyerConfigurationObject = require("./utility/configuration-object");
const { buildExcludedFilesRegex } = require("./utility/regex");
const { getDefaultFilesMetadata } = require("./utility/files");
const {
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  analyseCode,
  setAllStaticallyImportedFilesMapping,
  setAllImportedFilesMapping,
  setAllFileExports,
  createWebpackChunkMetadata,
  buildEntryFilesMappingFromArray,
  displayDuplicateFiles,
} = require("./utility/index");
const {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
  isDuplicatedFilesCheckRequired,
} = require("./utility/conditional-expressions-checks");
setConfiguration();
const { resolveAddressWithProvidedDirectory } = require("./utility/resolver");

const excludedFilesRegex = buildExcludedFilesRegex(
  codeAnalyerConfigurationObject.exclude
);

/**
 * Function which first analyses the code and prints the dead files present on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
const analyseCodeAndDetectDeadfiles = async (
  filesMetadata,
  programConfiguration
) => {
  const spinner = createNewCliSpinner();
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles, allFilesToCheck } = await getAllRequiredFiles(
    {
      directoriesToCheck: programConfiguration.directoriesToCheck,
      entry: programConfiguration.entry,
    },
    excludedFilesRegex,
    spinner
  );
  const entryFilesMapping = buildEntryFilesMappingFromArray(allEntryFiles);
  setAllFileExports(allEntryFiles, filesMetadata, entryFilesMapping);
  filesMetadata.visitedFilesMapping = {};
  analyseCode(allEntryFiles, filesMetadata, spinner);
  const allDeadFiles = getDeadFiles(allFilesToCheck, filesMetadata, spinner);
  const filesLengthObject = {
    deadFiles: allDeadFiles.length,
    filesToCheck: allFilesToCheck.length,
    entryFiles: allEntryFiles.length,
  };
  produceAnalysdDeadFileResult(filesMetadata, filesLengthObject);
  displayFilesOnScreen(allDeadFiles);
};

/**
 * Function which first analyses the code and prints the intra-module dependencies present on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
const analyseCodeAndDetectIntraModuleDependencies = async (
  filesMetadata,
  programConfiguration
) => {
  const spinner = createNewCliSpinner();
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: [programConfiguration.moduleToCheck],
      entry: programConfiguration.entry,
    },
    excludedFilesRegex,
    spinner
  );
  setAllStaticallyImportedFilesMapping(allEntryFiles, filesMetadata);
  const dependencyCheckerRelatedMetadata = {
    moduleLocation: resolveAddressWithProvidedDirectory(
      process.cwd(),
      programConfiguration.moduleToCheck
    ),
    isDepthFromFront: programConfiguration.isDepthFromFront,
    depth: programConfiguration.depth,
  };
  const intraModuleDependencies = getIntraModuleDependencies(
    dependencyCheckerRelatedMetadata,
    filesMetadata,
    spinner
  );
  const filesLengthObject = {
    intraModuleDependencies: intraModuleDependencies.length,
    entryFiles: allEntryFiles.length,
  };
  produceAnalysedIntraModuleDependenciesResult(
    filesMetadata,
    filesLengthObject
  );
  displayFilesOnScreen(intraModuleDependencies);
};

/**
 * Function which first analyses the code and then prints the files which are present in more than one chunk on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
const analyseCodeAndDetectAllDuplicateFiles = async (
  filesMetadata,
  programConfiguration
) => {
  const spinner = createNewCliSpinner();
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: programConfiguration.directoriesToCheck,
      entry: programConfiguration.entry,
    },
    excludedFilesRegex,
    spinner
  );
  setAllImportedFilesMapping(allEntryFiles, filesMetadata);
  const webpackChunkMetadata = createWebpackChunkMetadata(
    filesMetadata,
    spinner
  );
  displayDuplicateFiles(webpackChunkMetadata);
};

if (isDeadfileCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectDeadfiles(filesMetadata, codeAnalyerConfigurationObject);
}

if (isIntraModuleDependenciesCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectIntraModuleDependencies(
    filesMetadata,
    codeAnalyerConfigurationObject
  );
}

if (isDuplicatedFilesCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectAllDuplicateFiles(
    filesMetadata,
    codeAnalyerConfigurationObject
  );
}
