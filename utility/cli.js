const spinnies = require("spinnies");
const yargs = require("yargs");
const {
  getStringOrRegexFromArrayElement,
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
 * Will be called to set the codeAnalyser's configurations
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
          getStringOrRegexFromArrayElement(configurationObject[configuration]);
      case "checkIntraModuleDependencies":
        codeAnalyerConfigurationObject[configuration] =
          getStringOrRegexFromArrayElement(configurationObject[configuration]);
        break;
      case "isDepthFromFront":
        codeAnalyerConfigurationObject[configuration] =
          getStringOrRegexFromArrayElement(configurationObject[configuration]);
        break;
      case "moduleToCheck":
        codeAnalyerConfigurationObject[configuration] =
          getStringOrRegexFromArrayElement(
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
          getStringOrRegexFromArrayElement(
            configurationObject[configuration],
            true
          );
        break;
      case "depth":
        codeAnalyerConfigurationObject[configuration] =
          getStringOrRegexFromArrayElement(configurationObject[configuration]);
        break;
    }
  }
};
module.exports = {
  createNewCliSpinner,
  addNewInstanceToSpinner,
  updateSpinnerInstance,
  setConfiguration,
};
