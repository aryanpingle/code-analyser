#!/usr/bin/env node
const process = require("process");
const {
  createNewCliSpinner,
  setConfiguration,
  produceAnalysdDeadFileResult,
  produceAnalysedIntraModuleDependenciesResult,
} = require("./utility/cli");
const codeAnalyerConfigurationObject = require("./utility/configuration-object");
setConfiguration();
const { buildExcludedFilesRegex } = require("./utility/regex");
const { resolveAddressWithProvidedDirectory } = require("./utility/resolver");
const { getDefaultFilesMetadata } = require("./utility/files");

const {
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  analyseCode,
  setAllStaticallyImportedFilesMapping,
  setAllFileExports,
  buildEntryFilesMappingFromArray,
} = require("./utility/index");
const {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
} = require("./utility/conditional-expressions-checks");
const excludedFilesRegex = buildExcludedFilesRegex(
  codeAnalyerConfigurationObject.exclude
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
  console.log(intraModuleDependencies);
};

if (isDeadfileCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectDeadfiles(
    filesMetadata,
    codeAnalyerConfigurationObject,
    excludedFilesRegex
  );
}

if (isIntraModuleDependenciesCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectIntraModuleDependencies(
    filesMetadata,
    codeAnalyerConfigurationObject,
    excludedFilesRegex
  );
}
