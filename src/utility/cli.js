const spinnies = require("spinnies");
const yargs = require("yargs");
const cliTableBuilder = require("cli-table3");
const {
  getRequiredTypeElementFromString,
  getArrayOfElementsFromString,
} = require("./parse-string");
const codeAnalyerConfigurationObject = require("./configuration-object");
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
      case "exclude":
        codeAnalyerConfigurationObject[configuration] =
          getArrayOfElementsFromString(configurationObject[configuration]);
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
    }
  }
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
 * @param {String} file Absolute address of the duplicate file
 * @param {Array} fileChunksArray Array containing the chunks inside which this file is present
 */
const displayDuplicateFileDetails = (file, fileChunksArray) => {
  const statsTable = new cliTableBuilder({
    head: ["File", file],
  });
  fileChunksArray.forEach((chunk, index) => {
    statsTable.push([`Chunk ${index + 1}`, chunk]);
  });
  console.log(statsTable.toString());
};

/**
 * Will display the given array in a tabular form on the console
 * @param {Array} filesArray Array which is needed to be displayed on the console
 */
const displayFilesOnScreen = (filesArray) => {
  if (filesArray.length) {
    const statsTable = new cliTableBuilder({ head: ["Index", "File Address"] });
    filesArray.forEach((file, index) => statsTable.push([index + 1, file]));
    console.log(statsTable.toString());
  } else {
    // Print that no file found to display if the given array is empty
    console.log("\x1b[32m", "\nNo file meeting the required criteria present.");
  }
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
};
