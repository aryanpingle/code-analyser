#!/usr/bin/env node
const { fork } = require("child_process");
const process = require("process");
const path = require("path");
const {
  produceAnalysdDeadFileResult,
  displayAllFilesInteractively,
  displayFilesOnScreen,
  produceAnalysedDependenciesAtGivenDepthResult,
  displayDuplicateFileDetails,
  displayTextOnConsole,
} = require("./utility/cli");
const {
  CHECK_DEAD_FILES,
  CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
  CHECK_DUPLICATE_FILES,
  DISPLAY_TEXT,
  MESSAGE,
  ERROR,
  RUNNER_FILE,
  SIGINT,
  CHECK_POSSIBLE_CHUNKS_METADATA,
} = require("./utility/constants");

// Child process where computation part of the program will be done
const childProcess = fork(path.join(__dirname, RUNNER_FILE), process.argv, {
  silent: true,
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
    excludedFilesRegexString,
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
    case CHECK_DEPENDENCIES_AT_GIVEN_DEPTH:
      const dependenciesMetadata = {
        filesMetadata,
        filesLengthObject,
        filesArray,
        filesUsageMapping,
        interact,
      };
      displayDependenciesAtGivenDepthAnalysis(dependenciesMetadata);
      break;
    case CHECK_DUPLICATE_FILES:
      const duplicateFilesMetadata = {
        filesArray,
        filesUsageMapping,
        interact,
      };
      displayDuplicateFilesAnalysis(duplicateFilesMetadata);
      break;
    case CHECK_POSSIBLE_CHUNKS_METADATA:
      const possibleChunksMetadata = {
        filesArray,
        filesMetadata,
        excludedFilesRegexString,
        interact: true,
      };
      displayPossibleChunksMetadata(possibleChunksMetadata);

      break;
    case DISPLAY_TEXT:
      const textMetadata = {
        text,
        fileLocation,
      };
      displayTextOnConsole(textMetadata);
      break;
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
  if (interact) displayAllFilesInteractively(filesArray, {});
  else displayFilesOnScreen(filesArray);
};

/**
 * Function to display dependencies at given depth related data on the console
 * @param {Object} dependenciesMetadata Contains information required to print dependencies at given depth and it's analysis on the console
 */
const displayDependenciesAtGivenDepthAnalysis = ({
  filesMetadata,
  filesLengthObject,
  interact,
  filesArray,
  filesUsageMapping,
}) => {
  produceAnalysedDependenciesAtGivenDepthResult(
    filesMetadata,
    filesLengthObject
  );
  if (interact) displayAllFilesInteractively(filesArray, { filesUsageMapping });
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
  if (interact) displayAllFilesInteractively(filesArray, { filesUsageMapping });
  else displayDuplicateFileDetails(filesArray);
};

/**
 * Function to display possible chunks metadata on the console
 * @param {Object} possibleChunksMetadata Contains information required to print possible chunks metadata and their analysis on the console
 */
const displayPossibleChunksMetadata = ({
  filesArray,
  filesMetadata,
  interact,
  excludedFilesRegexString,
}) => {
  displayAllFilesInteractively(filesArray, {
    filesMetadata,
    checkForPossibleChunkMetadata: true,
    interact,
    excludedRegex: new RegExp(excludedFilesRegexString, "i"),
  });
};
