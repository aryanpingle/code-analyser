const spinnies = require("spinnies");
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

module.exports = {
  createNewCliSpinner,
  addNewInstanceToSpinner,
  updateSpinnerInstance,
};
