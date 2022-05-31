const config = require("./code-analyser.config.js");
const { buildExcludedPointsRegex } = require("./utility/regex");
const { directoryResolver } = require("./utility/resolver");
const {
  createNewCliSpinner,
  addNewInstanceToSpinner,
  updateSpinnerInstance,
} = require("./utility/cli");
const {
  getDefaultFilesMetadata,
  setDefaultFilesMetadata,
  getAllFiles,
} = require("./utility/files");
const {
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
} = require("./utility/index");

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
  analyseCode(allEntryFiles, filesMetadata, spinner);
  const allDeadFiles = getDeadFiles(allFilesToCheck, filesMetadata, spinner);
  console.log(allDeadFiles);
  // console.log(filesMetadata.filesMapping)
};

const analyseCodeAndDetectIntraModuleDependencies = async (
  filesMetadata,
  config,
  excludedPointsRegex
) => {
  const spinner = createNewCliSpinner();
  addNewInstanceToSpinner(spinner, "id2", "Retrieving entry files...");
  const allEntryFiles = await getAllFiles(
    [config.intraModuleDependencies.entryModule],
    {},
    excludedPointsRegex
  );
  updateSpinnerInstance(spinner, "id2", {
    text: "Successfully retrieved all entry files",
    status: "succeed",
  });
  analyseCode(allEntryFiles, filesMetadata, spinner);
  const intraModuleDependencies = getIntraModuleDependencies(
    filesMetadata,
    directoryResolver(__dirname, config.intraModuleDependencies.entryModule),
    spinner
  );
  console.log(intraModuleDependencies);
  // console.log(filesMetadata.visitedFilesMapping)
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
