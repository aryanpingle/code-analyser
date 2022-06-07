const config = require("./code-analyser.config.js");
const { buildExcludedPointsRegex } = require("./utility/regex");
const { directoryResolver } = require("./utility/resolver");
const { createNewCliSpinner } = require("./utility/cli");
const {
  getDefaultFilesMetadata,
  setDefaultFilesMetadata,
} = require("./utility/files");
const {
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  getAllImportsAndExportsOfEachFile,
} = require("./utility/index");
const { intraModuleDependencies } = require("./code-analyser.config.js");
const excludedPointsRegex = buildExcludedPointsRegex(config.exclude);
const filesMetadata = getDefaultFilesMetadata(excludedPointsRegex);
const analyseCodeAndDetectDeadFiles = async (
  filesMetadata,
  config,
  excludedPointsRegex
) => {
  const spinner = createNewCliSpinner();
  const { allEntryFiles, allFilesToCheck } = await getAllRequiredFiles(
    {
      directoriesToCheck: config.directoriesToCheck,
      entry: config.deadFiles.entry,
    },
    excludedPointsRegex,
    spinner
  );
  getAllImportsAndExportsOfEachFile(
    allEntryFiles,
    filesMetadata,
    "DEADFILE_FINDER_TRAVERSE"
  );
  filesMetadata.visitedFilesMapping = {};
  analyseCode(
    allEntryFiles,
    filesMetadata,
    spinner,
    "DEADFILE_FINDER_TRAVERSE"
  );
  const allDeadFiles = getDeadFiles(allFilesToCheck, filesMetadata, spinner);
  console.log(allDeadFiles);
};

const analyseCodeAndDetectIntraModuleDependencies = async (
  filesMetadata,
  config,
  excludedPointsRegex
) => {
  const spinner = createNewCliSpinner();
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: [config.intraModuleDependencies.moduleToCheck],
      entry: config.intraModuleDependencies.entry,
    },
    excludedPointsRegex,
    spinner
  );
  getAllImportsAndExportsOfEachFile(
    allEntryFiles,
    filesMetadata,
    "INTRA_MODULE_DEPENDENCY_TRAVERSE"
  );
  filesMetadata.visitedFilesMapping = {};
  analyseCode(
    allEntryFiles,
    filesMetadata,
    spinner,
    "INTRA_MODULE_DEPENDENCY_TRAVERSE"
  );
  const intraModuleDependencies = getIntraModuleDependencies(
    filesMetadata,
    directoryResolver(__dirname, config.intraModuleDependencies.moduleToCheck),
    spinner,
    config.intraModuleDependencies.depth
  );
  console.log(intraModuleDependencies);
};

if (config.deadFiles && config.deadFiles.check) {
  analyseCodeAndDetectDeadFiles(filesMetadata, config, excludedPointsRegex);
}

if (config.intraModuleDependencies && config.intraModuleDependencies.check) {
  setDefaultFilesMetadata(filesMetadata);
  analyseCodeAndDetectIntraModuleDependencies(
    filesMetadata,
    config,
    excludedPointsRegex
  );
}
