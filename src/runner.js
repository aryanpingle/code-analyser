const process = require("process");
const { setConfiguration } = require("./utility/cli");
setConfiguration();
const {
  codeAnalyerConfigurationObject,
  cacheMapping,
} = require("./utility/configuration");
const {
  buildExcludedFilesRegex,
  buildDependenciesAtGivenDepthRegex,
} = require("./utility/regex");
const { getDefaultFilesMetadata } = require("./utility/files");
const {
  getDeadFilesAndSendMessageToParent,
  analyseCode,
  setAllFileExports,
  buildEntryFilesMappingFromArray,
  getDependenciesAtGivenDepth,
  getDependenciesAtGivenDepthUsageMapping,
  getAllRequiredFiles,
  setImportedFilesMapping,
  createWebpackChunkMetadata,
  getFilesContributingInMultipleChunks,
  getFilesContributingInMultipleChunksMapping,
  getAllDependentFiles,
} = require("./utility/featureSpecificOperations/index");
const {
  isDeadfileCheckRequired,
  isDependenciesCheckRequiredAtGivenDepthCheckRequired,
  isFilesContributingInMultipleChunksCheckRequired,
  isChunkMetadataOfGivenFileCheckRequired,
} = require("./utility/helper");
const { resolveAddressWithProvidedDirectory } = require("./utility/resolver");
const {
  DEFAULT_TRUE_REGEX_STRING,
  CHECK_DEAD_FILES,
  CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
  CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS,
  CHECK_CHUNKS_METADATA_USING_GIVEN_FILE,
  DISPLAY_TEXT,
  ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE,
  IDENTIFICATION_OF_GIVEN_FILE_CHUNK_METADATA_MESSAGE,
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
  // Reset the visited files, will traverse them again
  filesMetadata.visitedFilesMapping = {};
  analyseCode(allEntryFiles, filesMetadata);
  const allDeadFiles = getDeadFilesAndSendMessageToParent(
    allFilesToCheck,
    filesMetadata
  );
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
 * Function which first analyses the code and prints the dependencies at a given depth on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
const analyseCodeAndDetectDependenciesAtGivenDepth = async (
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
  const { outsideModuleChecker, insideModuleChecker } =
    buildDependenciesAtGivenDepthRegex(
      dependencyCheckerRelatedMetadata.moduleLocation,
      dependencyCheckerRelatedMetadata.isDepthFromFront,
      dependencyCheckerRelatedMetadata.depth
    );
  filesMetadata.insideModuleRegex = codeAnalyerConfigurationObject.checkAll
    ? new RegExp(DEFAULT_TRUE_REGEX_STRING)
    : insideModuleChecker;
  setImportedFilesMapping(allEntryFiles, filesMetadata, {
    checkStaticImportsOnly: true,
  });

  const dependenciesAtGivenDepth = getDependenciesAtGivenDepth(
    outsideModuleChecker,
    filesMetadata
  );

  const filesLengthObject = {
    dependenciesAtGivenDepth: dependenciesAtGivenDepth.length,
    entryFiles: allEntryFiles.length,
  };

  const dependenciesUsageMapping = codeAnalyerConfigurationObject.interact
    ? getDependenciesAtGivenDepthUsageMapping(
        dependenciesAtGivenDepth,
        filesMetadata
      )
    : null;

  process.send({
    filesMetadata,
    filesLengthObject,
    filesArray: dependenciesAtGivenDepth,
    filesUsageMapping: dependenciesUsageMapping,
    messageType: CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
    interact: codeAnalyerConfigurationObject.interact,
  });
};

/**
 * Function which first analyses the code and then prints the files which are present in more than one chunk on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
const analyseCodeAndDetectAllFilesPresetInMultipleChunks = async (
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
  setImportedFilesMapping(allEntryFiles, filesMetadata, {
    checkStaticImportsOnly: false,
  });
  const webpackChunkMetadata = createWebpackChunkMetadata(filesMetadata);
  const allFilesInMultipleChunks =
    getFilesContributingInMultipleChunks(webpackChunkMetadata);

  const allFilesInMultipleChunksMapping =
    getFilesContributingInMultipleChunksMapping(allFilesInMultipleChunks);

  process.send({
    filesArray: allFilesInMultipleChunks,
    filesUsageMapping: allFilesInMultipleChunksMapping,
    messageType: CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS,
    interact: codeAnalyerConfigurationObject.interact,
  });
};

/**
 * Function which first analyses the code and then prints the files which are present in more than one chunk on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
const analyseCodeAndDetectChunkMetadataOfFiles = async (
  filesMetadata,
  programConfiguration
) => {
  const entryFile = resolveAddressWithProvidedDirectory(
    process.cwd(),
    programConfiguration.moduleToCheck
  );
  setImportedFilesMapping([entryFile], filesMetadata, {
    checkStaticImportsOnly: true,
    checkForFileSize: true,
  });
  process.send({
    text: ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE,
    messageType: DISPLAY_TEXT,
  });
  const givenFileDependencySet = getAllDependentFiles(entryFile, filesMetadata);
  process.send({
    text: IDENTIFICATION_OF_GIVEN_FILE_CHUNK_METADATA_MESSAGE,
    messageType: DISPLAY_TEXT,
  });
  process.send({
    filesArray: Array.from(givenFileDependencySet),
    cacheMapping,
    entryFile,
    messageType: CHECK_CHUNKS_METADATA_USING_GIVEN_FILE,
  });
};

if (isDeadfileCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectDeadfiles(filesMetadata, codeAnalyerConfigurationObject);
}

if (
  isDependenciesCheckRequiredAtGivenDepthCheckRequired(
    codeAnalyerConfigurationObject
  )
) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectDependenciesAtGivenDepth(
    filesMetadata,
    codeAnalyerConfigurationObject
  );
}

if (
  isFilesContributingInMultipleChunksCheckRequired(
    codeAnalyerConfigurationObject
  )
) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectAllFilesPresetInMultipleChunks(
    filesMetadata,
    codeAnalyerConfigurationObject
  );
}

if (isChunkMetadataOfGivenFileCheckRequired(codeAnalyerConfigurationObject)) {
  const filesMetadata = getDefaultFilesMetadata(excludedFilesRegex);
  analyseCodeAndDetectChunkMetadataOfFiles(
    filesMetadata,
    codeAnalyerConfigurationObject
  );
}
