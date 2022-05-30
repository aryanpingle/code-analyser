const spinnies = require("spinnies");
const dots = {
  interval: 50,
  frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
};

const createNewCliSpinner = () => new spinnies({ spinner: dots });

const addNewInstanceToSpinner = (spinner, id, text) =>
  spinner.add(id, { text });
const updateSpinnerInstance = (spinner, id, options) =>
  spinner.update(id, options);

module.exports = {
  createNewCliSpinner,
  addNewInstanceToSpinner,
  updateSpinnerInstance,
};
