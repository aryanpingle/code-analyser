#!/usr/bin/env node
const { fork } = require("child_process");
const process = require("process");
const {
  produceAnalysdDeadFileResult,
  displayAllFilesInteractively,
  displayFilesOnScreen,
  produceAnalysedIntraModuleDependenciesResult,
  displayDuplicateFileDetails,
  displayTextOnConsole,
} = require("./utility/cli");
const {
  CHECK_DEAD_FILES,
  CHECK_INTRA_MODULE_DEPENDENCIES,
  CHECK_DUPLICATE_FILES,
  DISPLAY_TEXT,
  MESSAGE,
  ERROR,
  RUNNER_FILE,
  SIGINT,
} = require("./utility/constants");
const path = require("path");

// Child process where computation part of the program will be done
const childProcess = fork(path.join(__dirname, RUNNER_FILE), process.argv, {
  // silent: true,
});

// When child process sends computed data back
childProcess.on(MESSAGE, (data) => {
  const {
    filesMetadata,
    filesLengthObject,
    fileLocation,
    interact,
    filesArray,
    filesUsageMapping,
    messageType,
    text,
  } = data;
  switch (messageType) {
    case CHECK_DEAD_FILES:
      const deadFilesMetadata = {
        filesMetadata,
        filesLengthObject,
        filesArray,
        interact,
      };
      displayDeadFilesAnalysis(deadFilesMetadata);
      break;
    case CHECK_INTRA_MODULE_DEPENDENCIES:
      const intraModuleDependenciesMetadata = {
        filesMetadata,
        filesLengthObject,
        filesArray,
        filesUsageMapping,
        interact,
      };
      displayIntraModuleDependenciesAnalysis(intraModuleDependenciesMetadata);
      break;
    case CHECK_DUPLICATE_FILES:
      const duplicateFilesMetadata = {
        filesArray,
        filesUsageMapping,
        interact,
      };
      displayDuplicateFilesAnalysis(duplicateFilesMetadata);
      break;
    case DISPLAY_TEXT:
      const textMetadata = {
        text,
        fileLocation,
      };
      displayTextOnConsole(textMetadata);
  }
});

childProcess.on(ERROR, (err) => {
  console.log(err);
});

// Kill the child process too when the parent process terminates
process.on(SIGINT, function () {
  process.kill(childProcess.pid);
  process.exit(1);
});

/**
 * Function to display dead files related data on the console
 * @param {Object} deadFilesMetadata Contains information required to print dead files and it's analysis on the console
 */
const displayDeadFilesAnalysis = ({
  filesMetadata,
  filesLengthObject,
  filesArray,
  interact,
}) => {
  produceAnalysdDeadFileResult(filesMetadata, filesLengthObject);
  if (interact) displayAllFilesInteractively(filesArray);
  else displayFilesOnScreen(filesArray);
};

/**
 * Function to display intra-module dependencies related data on the console
 * @param {Object} intraModuleDependenciesMetadata Contains information required to print intra-module dependencies and it's analysis on the console
 */
const displayIntraModuleDependenciesAnalysis = ({
  filesMetadata,
  filesLengthObject,
  interact,
  filesArray,
  filesUsageMapping,
}) => {
  produceAnalysedIntraModuleDependenciesResult(
    filesMetadata,
    filesLengthObject
  );
  if (interact) displayAllFilesInteractively(filesArray, filesUsageMapping);
  else displayFilesOnScreen(filesArray);
};

/**
 * Function to display duplicate files related data on the console
 * @param {Object} duplicateFilesMetadata Contains information required to print duplicate files and it's analysis on the console
 */
const displayDuplicateFilesAnalysis = ({
  filesArray,
  filesUsageMapping,
  interact,
}) => {
  if (interact) displayAllFilesInteractively(filesArray, filesUsageMapping);
  else displayDuplicateFileDetails(filesArray);
};
