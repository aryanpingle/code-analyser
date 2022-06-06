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
  updateFileWebpackChunk,
  getAllImportsAndExportsOfEachFile,
} = require("./utility/index");
const { checkFileImportsExports } = require("./checker/file-imports-exports-checker.js");

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
  getAllImportsAndExportsOfEachFile(allEntryFiles, filesMetadata);
  filesMetadata.visitedFilesMapping = {};
  analyseCode(allEntryFiles, filesMetadata, spinner);
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
  getAllImportsAndExportsOfEachFile(allEntryFiles, filesMetadata);

  filesMetadata.visitedFilesMapping = {};
  analyseCode(allEntryFiles, filesMetadata, spinner, "default");
  await updateFileWebpackChunk(filesMetadata);
  const intraModuleDependencies = getIntraModuleDependencies(
    filesMetadata,
    directoryResolver(__dirname, config.intraModuleDependencies.moduleToCheck),
    spinner
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
