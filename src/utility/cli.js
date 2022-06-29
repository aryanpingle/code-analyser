const process = require("process");
const { Select } = require("enquirer");
const yargs = require("yargs");
const cliTableBuilder = require("cli-table3");
const { getSizeFromInteger } = require("./parseElements");
const { buildTrie, getFirstNodeNotContainingOneChild } = require("./trie");
const {
  GO_BACK,
  YELLOW_COLOR,
  GREEN_COLOR,
  CLEAR,
  BOLD,
} = require("./constants");

/**
 * Will be used to print the analysed data
 * Will provide information related to how many files are feasible, entry, encountered, parsed or are dead
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} filesLengthObject Contains information related to various types of files
 */
const produceAnalysdDeadFileResult = (
  filesMetadata,
  { deadFiles, filesToCheck, entryFiles }
) => {
  const statsTable = new cliTableBuilder({
    head: ["Type", "Count", "Percentage"],
  });
  const totalFilesEcountered = Object.keys(filesMetadata.filesMapping).length,
    totalFilesParsed = Object.keys(filesMetadata.visitedFilesMapping).length;
  const typeArray = [
    "Feasible Files",
    "Entry Files",
    "Files Encountered",
    "Files Parsed",
    "Dead Files",
  ];
  const countArray = [
    filesToCheck,
    entryFiles,
    totalFilesEcountered,
    totalFilesParsed,
    deadFiles,
  ];
  for (const index in typeArray) {
    statsTable.push([
      typeArray[index],
      countArray[index],
      ((countArray[index] / filesToCheck) * 100).toFixed(2),
    ]);
  }
  console.log(statsTable.toString());
};

// Same as produceAnalysdDeadFileResult function but will provide information related to dependencies at a given depth instead of dead files
const produceAnalysedDependenciesAtGivenDepthResult = (
  filesMetadata,
  { dependenciesAtGivenDepth, entryFiles }
) => {
  const statsTable = new cliTableBuilder({
    head: ["Type", "Count", "Percentage"],
  });
  const totalFilesEcountered = Object.keys(filesMetadata.filesMapping).length,
    totalFilesParsed = Object.keys(filesMetadata.visitedFilesMapping).length;

  const typeArray = [
    "Files Encountered",
    "Files Parsed",
    "Entry Files",
    "Feasible Static Dependencies",
    "Dependencies at the provided depth",
  ];
  const countArray = [
    totalFilesEcountered,
    totalFilesParsed,
    entryFiles,
    totalFilesEcountered - entryFiles,
    dependenciesAtGivenDepth,
  ];
  for (const index in typeArray) {
    statsTable.push([
      typeArray[index],
      countArray[index],
      ((countArray[index] / totalFilesEcountered) * 100).toFixed(2),
    ]);
  }
  console.log(statsTable.toString());
};

/**
 * Will create a new table on the CLI which shows a file, along with the chunks (inside which it is present), which is present in more than one chunk
 * @param {Array} filesObjectArray Array containing the each file's object which contains the chunks inside which it is present and it's address
 */
const displayFilesContributingInMultipleChunksDetails = (filesObjectArray) => {
  filesObjectArray.forEach((fileObject) => {
    const statsTable = new cliTableBuilder({
      head: ["File", fileObject.file],
    });
    fileObject.chunksArray.forEach((chunk, index) => {
      statsTable.push([`Chunk ${index + 1}`, chunk]);
    });
    console.log(statsTable.toString());
  });
};

/**
 * Will display the given array in a tabular form on the console
 * @param {Array} filesArray Array which is needed to be displayed on the console
 */
const displayFilesOnScreen = (filesArray) => {
  if (filesArray.length) {
    filesArray.sort(
      (fileOne, fileTwo) => fileTwo.filePoints - fileOne.filePoints
    );
    const statsTable = new cliTableBuilder({ head: ["Index", "File Address"] });
    filesArray.forEach((fileObject, index) =>
      statsTable.push([index + 1, fileObject.file])
    );
    console.log(statsTable.toString());
  }
  // Print that no file found to display if the given array is empty
  else
    console.log(
      GREEN_COLOR,
      "\nNo file meeting the required criteria present."
    );
};

/**
 * Can be used to display all files along with additional information to display with them on the screen interactively
 * @param {Array} filesArray Contains file name and other information
 * @param {Object} metadata Contains additional information which are printed specifically for some features
 */
const displayAllFilesInteractively = async (
  filesArray,
  {
    filesUsageMapping = {},
    checkForChunkMetadataOfGivenFile = false,
    cacheMapping = {},
  }
) => {
  if (filesArray.length === 0) {
    console.log(
      GREEN_COLOR,
      "\nNo file meeting the required criteria present."
    );
  }
  const headNode = buildTrie(filesArray);
  const nodesInLastVisitedPaths = [
    { node: headNode, selectedChoiceIndex: null },
  ];

  while (nodesInLastVisitedPaths.length) {
    const firstNodeNotContainingOneChild = getFirstNodeNotContainingOneChild(
      nodesInLastVisitedPaths[nodesInLastVisitedPaths.length - 1].node
    );
    const pathToCheck = firstNodeNotContainingOneChild.pathTillNode;
    if (filesUsageMapping[pathToCheck])
      displayFileAdditionalInformation(
        pathToCheck,
        filesUsageMapping[pathToCheck]
      );
    if (checkForChunkMetadataOfGivenFile && cacheMapping[pathToCheck])
      displayChunkMetadaRelatedInformation(cacheMapping, pathToCheck);

    const { selectedNode: nextNodeToCheck, choiceIndex } =
      await interactivelyDisplayAndGetNextNode(
        firstNodeNotContainingOneChild,
        nodesInLastVisitedPaths[nodesInLastVisitedPaths.length - 1]
          .selectedChoiceIndex
      );

    if (nextNodeToCheck === GO_BACK) nodesInLastVisitedPaths.pop();
    else {
      nodesInLastVisitedPaths[
        nodesInLastVisitedPaths.length - 1
      ].selectedChoiceIndex = choiceIndex;

      nodesInLastVisitedPaths.push({
        node: nextNodeToCheck,
        selectedChoiceIndex: null,
      });
    }
    process.stdout.write(CLEAR);
  }
};

/**
 * Provides users with choices to select the next file/ folder to visit
 * @param {Object} nodeToCheck Current trie node which is being visited
 * @param {String} selectedChoiceIndex Previously selected choice's index
 * @returns Next trie node to visit
 */
const interactivelyDisplayAndGetNextNode = async (
  nodeToCheck,
  selectedChoiceIndex = GO_BACK
) => {
  const choices = [GO_BACK];
  const addressToNodeMapping = {};
  addressToNodeMapping[GO_BACK] = GO_BACK;
  let prompt;
  if (Object.keys(nodeToCheck.childrens).length === 0) {
    prompt = new Select({
      message: `Currently at location: ${nodeToCheck.pathTillNode}\n`,
      choices: choices,
      autofocus: selectedChoiceIndex,
    });
  } else {
    for (const index in nodeToCheck.childrens) {
      const nodeToCheckAddress = nodeToCheck.childrens[index].pathTillNode;
      choices.push(nodeToCheckAddress);
      addressToNodeMapping[nodeToCheckAddress] = nodeToCheck.childrens[index];
    }
    prompt = new Select({
      message: `Currently at location: ${nodeToCheck.pathTillNode}\nPick file/folder to check:`,
      choices,
      autofocus: selectedChoiceIndex,
    });
  }
  const choicePicked = await prompt.run();
  return {
    selectedNode: addressToNodeMapping[choicePicked],
    choiceIndex: choicePicked,
  };
};

/**
 * Used to display additional information along with the file's name
 * @param {String} file File whose details have to be displayed
 * @param {Array} additionalInformationArray Array consisting of information to display related to the given file
 */
const displayFileAdditionalInformation = (file, additionalInformationArray) => {
  const statsTable = new cliTableBuilder({
    head: ["Index", file],
  });
  additionalInformationArray.forEach((information, index) => {
    statsTable.push([index + 1, information]);
  });
  console.log(statsTable.toString());
};

const displayTextOnConsole = ({ text, fileLocation }) => {
  if (fileLocation) console.log(YELLOW_COLOR, "Unable to parse:", fileLocation);
  console.log(GREEN_COLOR, text);
};

/**
 * Function which displays the dependencies of the chunk corresponding to the given file on the screen
 * @param {Object} cacheMapping Cached data which is used to display information related to each file which is present inside the chunk
 * @param {String} fileLocation Absolute address of the file which will used as an entry to build the chunk's metadata
 */
const displayChunkMetadaRelatedInformation = (cacheMapping, fileLocation) => {
  const fileInformationArray = cacheMapping[fileLocation].dependencyArray;
  if (fileInformationArray.length === 0) return;
  fileInformationArray.sort(
    (firstFile, secondFile) =>
      cacheMapping[secondFile].effectiveSize -
      cacheMapping[firstFile].effectiveSize
  );
  const statsTable = new cliTableBuilder({
    head: ["Index", "File Name", "Effective Size"],
  });
  const totalFilesToShow = yargs.argv.totalFilesToShow;
  for (const index in fileInformationArray) {
    if (totalFilesToShow !== -1 && index >= totalFilesToShow) break;
    const file = fileInformationArray[index];
    const currentFileSize = cacheMapping[file]
      ? cacheMapping[file].effectiveSize
      : 0;
    statsTable.push([
      parseInt(index) + 1,
      file,
      getSizeFromInteger(currentFileSize),
    ]);
  }
  console.log(statsTable.toString());
  console.log(
    BOLD,
    `\nTotal Chunk Size: ${getSizeFromInteger(
      cacheMapping[fileInformationArray[0]].effectiveSize
    )}\n`
  );
};

module.exports = {
  produceAnalysdDeadFileResult,
  produceAnalysedDependenciesAtGivenDepthResult,
  displayFilesContributingInMultipleChunksDetails,
  displayChunkMetadaRelatedInformation,
  displayFilesOnScreen,
  displayAllFilesInteractively,
  displayTextOnConsole,
};
