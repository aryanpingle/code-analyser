const config = require("./code-analyser.config.js");
const { buildExcludedPointsRegex } = require("./utility/regex");
const { directoryResolver } = require("./utility/resolver");
const { createNewCliSpinner } = require("./utility/cli");
const {
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
} = require("./utility/index");

const excludedPointsRegex = buildExcludedPointsRegex(config.exclude);
const filesMetadata = {
  filesMapping: {},
  visitedFilesMapping: {},
  excludedPointsRegex: excludedPointsRegex,
  unparsableVistedFiles: 0,
};
const checkIntraModuleDependencies = Array.isArray(config.entry)
  ? false
  : config.entry.checkIntraModuleDependencies;

const getAllDeadFilesAndIntraModuleDependencies = async (
  filesMetadata,
  config,
  excludedPointsRegex
) => {
  const spinner = createNewCliSpinner();
  const { allEntryFiles, allFilesToCheck } = await getAllRequiredFiles(
    config,
    excludedPointsRegex,
    spinner
  );
  analyseCode(allEntryFiles, filesMetadata, spinner);
  const allDeadFiles = getDeadFiles(allFilesToCheck, filesMetadata, spinner);
  console.log(allDeadFiles);
  if (checkIntraModuleDependencies) {
    const intraModuleDependencies = getIntraModuleDependencies(
      filesMetadata,
      directoryResolver(__dirname, config.entry.source),
      spinner
    );
    console.log(intraModuleDependencies);
  }
};

getAllDeadFilesAndIntraModuleDependencies(
  filesMetadata,
  config,
  excludedPointsRegex
);
