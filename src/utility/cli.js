const { Select } = require("enquirer");
const spinnies = require("spinnies");
const yargs = require("yargs");
const cliTableBuilder = require("cli-table3");
const {
  getRequiredTypeElementFromString,
  getArrayOfElementsFromString,
} = require("./parse-string");
const codeAnalyerConfigurationObject = require("./configuration-object");
const { buildTrie, getFirstNodeNotContainingOneChild } = require("./trie");
const { GO_BACK } = require("./constants");
const dots = {
  interval: 50,
  frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
};

/**
 * Returns a new spinner container which will improve the output display on the console
 * @returns New spinner container
 */
const createNewCliSpinner = () => new spinnies({ spinner: dots });

/**
 * Adds a new instance inside the spinner container
 * @param {Object} spinner Spinner container inside which this a new spinner instance will be added
 * @param {String} id ID of the spinner instance
 * @param {String} text Text which has to be displayed inside this new instance
 */
const addNewInstanceToSpinner = (spinner, id, text) =>
  spinner.add(id, { text });

/**
 * Updates an existing spinner instance
 * @param {Object} spinner Spinner container inside which this instance is present
 * @param {String} id ID of the spinner instance which has to be update
 * @param {Object} options Object which contains data which will be used to update the instance
 */
const updateSpinnerInstance = (spinner, id, options) =>
  spinner.update(id, options);

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
      case "checkIntraModuleDependencies":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
        break;
      case "checkDuplicateFiles":
        codeAnalyerConfigurationObject[configuration] =
          getRequiredTypeElementFromString(configurationObject[configuration]);
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

// Same as produceAnalysdDeadFileResult function but will provide information related to intra-module dependencies instead of dead files
const produceAnalysedIntraModuleDependenciesResult = (
  filesMetadata,
  { intraModuleDependencies, entryFiles }
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
    "Intra-Module dependencies",
  ];
  const countArray = [
    totalFilesEcountered,
    totalFilesParsed,
    entryFiles,
    totalFilesEcountered - entryFiles,
    intraModuleDependencies,
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
    console.log("\x1b[32m", "\nNo file meeting the required criteria present.");
};
/**
 * Will print the error found while parsing a file on the console
 * @param {String} fileLocation Absolute address of the file which is being parsed
 * @param {String} error Error found while parsing the given file
 */
const displayFileParseErrorMessage = (fileLocation, error) => {
  console.error("\x1b[33m", "Unable to parse file:", fileLocation);
  console.error(error);
};

/**
 * Can be used to display all files along with additional information to display with them on the screen interactively
 * @param {Array} filesArray Contains file name and other information
 * @param {Object} filesAdditionalInformationMapping Can be used to display which files use intra-module dependencies/ display webpack chunks
 */
const displayAllFilesInteractively = async (
  filesArray,
  filesAdditionalInformationMapping = {}
) => {
  if (filesArray.length === 0) {
    console.log("\x1b[32m", "\nNo file meeting the required criteria present.");
  }
  const headNode = buildTrie(filesArray);
  const nodesInLastVisitedPaths = [headNode];

  while (nodesInLastVisitedPaths.length) {
    const firstNodeNotContainingOneChild = getFirstNodeNotContainingOneChild(
      nodesInLastVisitedPaths[nodesInLastVisitedPaths.length - 1]
    );
    if (
      filesAdditionalInformationMapping[
        firstNodeNotContainingOneChild.pathTillNode
      ]
    ) {
      displayFileAdditionalInformation(
        firstNodeNotContainingOneChild.pathTillNode,
        filesAdditionalInformationMapping[
          firstNodeNotContainingOneChild.pathTillNode
        ]
      );
    }
    const nextNodeToCheck = await interactivelyDisplayAndGetNextNode(
      firstNodeNotContainingOneChild
    );
    if (nextNodeToCheck === GO_BACK) nodesInLastVisitedPaths.pop();
    else nodesInLastVisitedPaths.push(nextNodeToCheck);
    console.clear();
  }
};

/**
 * Provides users with choices to select the next file/ folder to visit
 * @param {Object} nodeToCheck Current trie node which is being visited
 * @returns Next trie node to visit
 */
const interactivelyDisplayAndGetNextNode = async (nodeToCheck) => {
  const choices = [GO_BACK];
  const addressToNodeMapping = {};
  addressToNodeMapping[GO_BACK] = GO_BACK;
  let prompt;
  if (Object.keys(nodeToCheck.childrens).length === 0) {
    prompt = new Select({
      name: "value",
      message: `Currently at location: ${nodeToCheck.pathTillNode}\n`,
      choices: choices,
    });
  } else {
    for (const index in nodeToCheck.childrens) {
      const nodeToCheckAddress = nodeToCheck.childrens[index].pathTillNode;
      choices.push(nodeToCheckAddress);
      addressToNodeMapping[nodeToCheckAddress] = nodeToCheck.childrens[index];
    }
    prompt = new Select({
      name: "value",
      message: `Currently at location: ${nodeToCheck.pathTillNode}\nPick file/folder to check:`,
      choices,
    });
  }
  const choicePicked = await prompt.run();
  return addressToNodeMapping[choicePicked];
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

module.exports = {
  createNewCliSpinner,
  addNewInstanceToSpinner,
  updateSpinnerInstance,
  setConfiguration,
  produceAnalysdDeadFileResult,
  produceAnalysedIntraModuleDependenciesResult,
  displayDuplicateFileDetails,
  displayFilesOnScreen,
  displayFileParseErrorMessage,
  displayAllFilesInteractively,
};
