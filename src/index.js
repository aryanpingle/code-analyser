#!/usr/bin/env node
const { fork } = require("child_process");
const process = require("process");
const path = require("path");
const {
  produceAnalysdDeadFileResult,
  displayAllFilesInteractively,
  displayFilesOnScreen,
  produceAnalysedDependenciesAtGivenDepthResult,
  displayFilesContributingInMultipleChunksDetails,
  displayTextOnConsole,
} = require("./utility/cli");
const {
  CHECK_DEAD_FILES,
  CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
  CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS,
  DISPLAY_TEXT,
  MESSAGE,
  ERROR,
  RUNNER_FILE,
  SIGINT,
  CHECK_CHUNKS_METADATA_USING_GIVEN_FILE,
  GREEN_COLOR,
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
    case CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS:
      const filesContributingInMultipleChunksMetadata = {
        filesArray,
        filesUsageMapping,
        interact,
      };
      displayFilesInMultipleChunksAnalysis(
        filesContributingInMultipleChunksMetadata
      );
      break;
    case CHECK_CHUNKS_METADATA_USING_GIVEN_FILE:
      const chunksMetadata = {
        filesArray,
        filesMetadata,
        excludedFilesRegexString,
        interact: true,
      };
      displayAllFilesChunkMetadataInteractively(chunksMetadata);

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
 * Function to display files present in multiple chunks related data on the console
 * @param {Object} filesContributingInMultipleChunksMetadata Contains information required to print files present in multiple chunks and it's analysis on the console
 */
const displayFilesInMultipleChunksAnalysis = ({
  filesArray,
  filesUsageMapping,
  interact,
}) => {
  if (interact) displayAllFilesInteractively(filesArray, { filesUsageMapping });
  else displayFilesContributingInMultipleChunksDetails(filesArray);
};

/**
 * Function to display all chunks metadata using given files interactively on the console
 * @param {Object} chunksMetadata Contains information required to print a given file's chunk analysis on the console
 */
const displayAllFilesChunkMetadataInteractively = ({
  filesArray,
  filesMetadata,
  interact,
  excludedFilesRegexString,
}) => {
  console.log(GREEN_COLOR, "Established relationship between all files");
  displayAllFilesInteractively(filesArray, {
    filesMetadata,
    checkForChunkMetadataOfGivenFile: true,
    interact,
    excludedRegex: new RegExp(excludedFilesRegexString, "i"),
  });
};
