const process = require("process");
const { Select } = require("enquirer");
const yargs = require("yargs");
const cliTableBuilder = require("cli-table3");
const {
  getRequiredTypeElementFromString,
  getArrayOfElementsFromString,
  getSizeFromInteger,
} = require("./parseElements");
const { codeAnalyerConfigurationObject } = require("./configuration");
const { buildTrie, getFirstNodeNotContainingOneChild } = require("./trie");
const {
  GO_BACK,
  YELLOW_COLOR,
  GREEN_COLOR,
  CLEAR,
  BOLD,
} = require("./constants");
const {
  getAllDependentFiles,
} = require("./featureSpecificOperations/possibleChunksMetadata");

/**
 * Will be called to set the configuration of the program using the arguments provided on the CLI
 */
const setConfiguration = () => {
  const configurationObject = yargs.argv;
  for (const configuration in configurationObject) {
    switch (configuration) {
      case "entry":
        codeAnalyerConfigurationObject[configuration] =
          getArrayOfElementsFromString(configurationObject[configuration]);
        break;
      case "include":
        codeAnalyerConfigurationObject[configuration].push(
          ...getArrayOfElementsFromString(configurationObject[configuration])
        );
        break;
      case "exclude":
        codeAnalyerConfigurationObject[configuration].push(
          ...getArrayOfElementsFromString(configurationObject[configuration])
        );
        break;
      case "checkDeadFiles":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkDependenciesAtGivenDepth":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkDuplicateFiles":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkPossibleChunksMetadata":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "isDepthFromFront":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "moduleToCheck":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(
            configurationObject[configuration],
            true
          );
        break;
      case "directoriesToCheck":
        codeAnalyerConfigurationObject[configuration] =
          getArrayOfElementsFromString(configurationObject[configuration]);
        break;
      case "rootDirectory":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(
            configurationObject[configuration],
            true
          );
        break;
      case "depth":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "interact":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkAll":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
    }
  }
  if (codeAnalyerConfigurationObject.directoriesToCheck)
    codeAnalyerConfigurationObject.include.push(
      ...codeAnalyerConfigurationObject.directoriesToCheck
    );
};

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
const displayDuplicateFileDetails = (filesObjectArray) => {
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
 * @param {Object} filesUsageMapping Can be used to display which files use retrieved dependencies/ display webpack chunks
 */
const displayAllFilesInteractively = async (
  filesArray,
  {
    filesUsageMapping = {},
    checkForPossibleChunkMetadata = false,
    filesMetadata = {},
    excludedRegex,
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
    if (
      checkForPossibleChunkMetadata &&
      filesMetadata.filesMapping[pathToCheck]
    )
      displayPossibleChunksMetadata(pathToCheck, filesMetadata, excludedRegex);

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
 * Function to get and display all the dependencies of the provided file, along with the approx uncompressed chunk size
 * @param {String} fileLocation
 * @param {Object} filesMetadata
 * @param {Regex} excludedRegex To exclude files which aren't required to be checked
 */
const displayPossibleChunksMetadata = (
  fileLocation,
  filesMetadata,
  excludedRegex
) => {
  const currentFileSet = getAllDependentFiles(fileLocation, {
    filesMetadata,
    excludedRegex,
  });
  displayChunkMetadaRelatedInformation(
    Array.from(currentFileSet),
    filesMetadata.filesMapping
  );
};

/**
 * Function (called by displayPossibleChunksMetadata) which displays the given dependencies of the file on the screen
 * @param {Array} fileInformationArray Contains information related to dependencies of a given file and size of each file
 * @param {Object} filesMapping Contains size of each file
 */
const displayChunkMetadaRelatedInformation = (
  fileInformationArray,
  filesMapping
) => {
  fileInformationArray.sort(
    (firstFile, secondFile) =>
      filesMapping[secondFile].fileSize - filesMapping[firstFile].fileSize
  );
  const statsTable = new cliTableBuilder({
    head: ["Index", "File Name", "File Size"],
  });
  let totalSize = 0;
  fileInformationArray.forEach((file, index) => {
    const currentFileSize = filesMapping[file].fileSize
      ? filesMapping[file].fileSize
      : 0;
    totalSize += currentFileSize;
    statsTable.push([index + 1, file, getSizeFromInteger(currentFileSize)]);
  });
  console.log(statsTable.toString());
  console.log(BOLD, `\nTotal Chunk Size: ${getSizeFromInteger(totalSize)}\n`);
};

module.exports = {
  setConfiguration,
  produceAnalysdDeadFileResult,
  produceAnalysedDependenciesAtGivenDepthResult,
  displayDuplicateFileDetails,
  displayFilesOnScreen,
  displayAllFilesInteractively,
  displayTextOnConsole,
};
