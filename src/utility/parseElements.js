const { NUMBER, BOOLEAN, TRUE, SIZES_ARRAY } = require("./constants");

// Parses the given string and return the appropriate type element (number, regex, string)
const getRequiredTypeElementFromString = (
  arrayElement,
  cannotBeRegex = false
) => {
  if (typeof arrayElement === NUMBER || typeof arrayElement === BOOLEAN)
    return arrayElement;
  arrayElement = arrayElement.trim();
  // if path is provided
  if (/['"].*['"]/.test(arrayElement) || cannotBeRegex)
    return arrayElement.replace(/['"](.*)['"]/, "$1");
  // if true/false given
  else if (/true|false/.test(arrayElement)) return arrayElement === TRUE;
  // if regex given
  arrayElement = arrayElement.replace(/\/(.*)\//, "$1");
  return new RegExp(arrayElement);
};

// Returns an array consisting of elements which have been parsed from a string
const getArrayOfElementsFromString = (arrayString) => {
  return arrayString
    .slice(1, -1)
    .split(",")
    .map((entryElement) => {
      return getRequiredTypeElementFromString(entryElement);
    });
};

const getSizeFromInteger = (givenInteger) => {
  const possibleSizes = SIZES_ARRAY;
  const MULTIPLIER_TO_GET_NEXT_SIZE = 1024;
  let sizeToCheck = 1;
  for (const size of possibleSizes) {
    sizeToCheck *= MULTIPLIER_TO_GET_NEXT_SIZE;
    if (givenInteger / sizeToCheck < 1) {
      sizeToCheck /= MULTIPLIER_TO_GET_NEXT_SIZE;
      return `${(givenInteger / sizeToCheck).toFixed(2)} ${size}`;
    }
  }
  sizeToCheck /= MULTIPLIER_TO_GET_NEXT_SIZE;
  return `${(givenInteger / sizeToCheck).toFixed(2)} ${
    possibleSizes[possibleSizes.length - 1]
  }`;
};
module.exports = {
  getRequiredTypeElementFromString,
  getArrayOfElementsFromString,
  getSizeFromInteger,
};
