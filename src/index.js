#!/usr/bin/env node
import { fork } from "child_process";
import process from "process";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import {
  produceAnalysedDeadFilesResult,
  displayAllFilesInteractively,
  displayFilesOnScreen,
  produceAnalysedDependenciesAtGivenDepthResult,
  displayFilesContributingInMultipleChunksDetails,
  displayTextOnConsole,
  displayChunkMetadaRelatedInformation,
} from "./utility/cli/index.js";

import {
  CHECK_DEAD_FILES,
  CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
  CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS,
  DISPLAY_TEXT,
  MESSAGE,
  ERROR,
  RUNNER_FILE,
  SIGINT,
  CHECK_CHUNK_METADATA_USING_GIVEN_FILE,
} from "./utility/constants.js";

const directoryAddress = dirname(fileURLToPath(import.meta.url));
// Child process where computation part of the program will be done
const childProcess = fork(
  path.join(directoryAddress, RUNNER_FILE),
  process.argv,
  {
    silent: true,
  }
);

// When child process sends computed data back
childProcess.on(MESSAGE, (data) => {
  const {
    filesMetadata,
    filesLengthObject,
    fileLocation,
    interact,
    filesArray,
    filesUsageMapping,
    cacheMapping,
    entryFile,
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
    case CHECK_CHUNK_METADATA_USING_GIVEN_FILE:
      const chunksMetadata = {
        filesArray,
        cacheMapping,
        entryFile,
      };
      displayMetadataOfGivenChunkAnalysis(chunksMetadata);

      break;
    case DISPLAY_TEXT:
      const textMetadata = {
        text,
        fileLocation,
      };
      displayTextOnConsole(textMetadata);
      break;
    default:
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
  produceAnalysedDeadFilesResult(filesMetadata, filesLengthObject);
  const outputMetadata = {
    isInteractionRequired: interact,
    filesArray,
    filesAdditionalInformationMapping: {},
    nonInteractionOutputFunction: displayFilesOnScreen,
  };
  displayOutputOnConsole(outputMetadata);
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
  const outputMetadata = {
    isInteractionRequired: interact,
    filesArray,
    filesAdditionalInformationMapping: { filesUsageMapping },
    nonInteractionOutputFunction: displayFilesOnScreen,
  };

  displayOutputOnConsole(outputMetadata);
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
  const outputMetadata = {
    isInteractionRequired: interact,
    filesArray,
    filesAdditionalInformationMapping: { filesUsageMapping },
    nonInteractionOutputFunction:
      displayFilesContributingInMultipleChunksDetails,
  };

  displayOutputOnConsole(outputMetadata);
};

/**
 * Function to display metadata of given chunk interactively on the console
 * @param {Object} chunksMetadata Contains information required to print a given file's chunk analysis on the console
 */
const displayMetadataOfGivenChunkAnalysis = ({
  filesArray,
  cacheMapping,
  entryFile,
}) => {
  displayChunkMetadaRelatedInformation(cacheMapping, entryFile);
  const outputMetadata = {
    isInteractionRequired: true,
    filesArray,
    filesAdditionalInformationMapping: {
      checkMetadataOfGivenChunk: true,
      cacheMapping,
    },
  };

  displayOutputOnConsole(outputMetadata);
};

/**
 * Will be used to print output on the console, depending upon whether interaction is required, and function to use if not
 * @param {Object} metadata
 */
const displayOutputOnConsole = ({
  isInteractionRequired,
  filesArray,
  filesAdditionalInformationMapping,
  nonInteractionOutputFunction,
}) => {
  if (isInteractionRequired)
    displayAllFilesInteractively(filesArray, filesAdditionalInformationMapping);
  else nonInteractionOutputFunction(filesArray);
};
