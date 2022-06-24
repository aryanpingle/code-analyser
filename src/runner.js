const process = require("process");
const { setConfiguration } = require("./utility/cli");
setConfiguration();
const codeAnalyerConfigurationObject = require("./utility/configuration-object");
const {
  buildExcludedFilesRegex,
  buildIntraModuleDependencyRegex,
} = require("./utility/regex");
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
  getDuplicateFiles,
  getIntraModuleDependenciesUsageMapping,
  getDuplicateFilesChunksMapping,
} = require("./utility/index");
const {
  isDeadfileCheckRequired,
  isIntraModuleDependenciesCheckRequired,
  isDuplicatedFilesCheckRequired,
} = require("./utility/helper");
const { resolveAddressWithProvidedDirectory } = require("./utility/resolver");
const {
  DEFAULT_TRUE_REGEX_STRING,
  CHECK_DEAD_FILES,
  CHECK_INTRA_MODULE_DEPENDENCIES,
  CHECK_DUPLICATE_FILES,
} = require("./utility/constants");

const excludedFilesRegex = buildExcludedFilesRegex(
  codeAnalyerConfigurationObject.exclude,
  codeAnalyerConfigurationObject.include
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
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles, allFilesToCheck } = await getAllRequiredFiles(
    {
      directoriesToCheck: programConfiguration.directoriesToCheck,
      entry: programConfiguration.entry,
    },
    excludedFilesRegex
  );
  const entryFilesMapping = buildEntryFilesMappingFromArray(allEntryFiles);
  setAllFileExports(allEntryFiles, filesMetadata, entryFilesMapping);
  filesMetadata.visitedFilesMapping = {};
  analyseCode(allEntryFiles, filesMetadata);
  const allDeadFiles = getDeadFiles(allFilesToCheck, filesMetadata);
  const filesLengthObject = {
    deadFiles: allDeadFiles.length,
    filesToCheck: allFilesToCheck.length,
    entryFiles: allEntryFiles.length,
  };

  process.send({
    filesMetadata,
    filesLengthObject,
    filesArray: allDeadFiles,
    messageType: CHECK_DEAD_FILES,
    interact: codeAnalyerConfigurationObject.interact,
  });
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
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: [programConfiguration.moduleToCheck],
      entry: programConfiguration.entry,
    },
    excludedFilesRegex
  );
  const dependencyCheckerRelatedMetadata = {
    moduleLocation: resolveAddressWithProvidedDirectory(
      process.cwd(),
      programConfiguration.moduleToCheck
    ),
    isDepthFromFront: programConfiguration.isDepthFromFront,
    depth: programConfiguration.depth,
  };
  const { intraModuleChecker, insideModuleChecker } =
    buildIntraModuleDependencyRegex(
      dependencyCheckerRelatedMetadata.moduleLocation,
      dependencyCheckerRelatedMetadata.isDepthFromFront,
      dependencyCheckerRelatedMetadata.depth
    );
  dependencyCheckerRelatedMetadata.intraModuleDependencyRegex =
    intraModuleChecker;
  filesMetadata.insideModuleRegex = codeAnalyerConfigurationObject.checkAll
    ? new RegExp(DEFAULT_TRUE_REGEX_STRING)
    : insideModuleChecker;

  setAllStaticallyImportedFilesMapping(allEntryFiles, filesMetadata);

  const intraModuleDependencies = getIntraModuleDependencies(
    dependencyCheckerRelatedMetadata,
    filesMetadata
  );

  const filesLengthObject = {
    intraModuleDependencies: intraModuleDependencies.length,
    entryFiles: allEntryFiles.length,
  };

  const intraModuleDependenciesUsageMapping =
    getIntraModuleDependenciesUsageMapping(
      intraModuleDependencies,
      filesMetadata
    );

  process.send({
    filesMetadata,
    filesLengthObject,
    filesArray: intraModuleDependencies,
    filesUsageMapping: intraModuleDependenciesUsageMapping,
    messageType: CHECK_INTRA_MODULE_DEPENDENCIES,
    interact: codeAnalyerConfigurationObject.interact,
  });
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
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: programConfiguration.directoriesToCheck,
      entry: programConfiguration.entry,
    },
    excludedFilesRegex
  );
  setAllImportedFilesMapping(allEntryFiles, filesMetadata);
  const webpackChunkMetadata = createWebpackChunkMetadata(filesMetadata);
  const allDuplicateFiles = getDuplicateFiles(webpackChunkMetadata);

  const duplicateFilesChunksMapping =
    getDuplicateFilesChunksMapping(allDuplicateFiles);

  process.send({
    filesArray: allDuplicateFiles,
    filesUsageMapping: duplicateFilesChunksMapping,
    messageType: CHECK_DUPLICATE_FILES,
    interact: codeAnalyerConfigurationObject.interact,
  });
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
