// Parses the given string and return the appropriate type element (number, regex, string)
const getStringOrRegexFromArrayElement = (
  arrayElement,
  cannotBeRegex = false
) => {
  if (typeof arrayElement === "number") return arrayElement;
  arrayElement = arrayElement.trim();
  // if path is provided
  if (/".*"/.test(arrayElement) || cannotBeRegex)
    return arrayElement.replace(/['"](.*)['"]/, "$1");
  // if true/false given
  else if (/true|false/.test(arrayElement)) return arrayElement === "true";
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
      return getStringOrRegexFromArrayElement(entryElement);
    });
};
module.exports = {
  getStringOrRegexFromArrayElement,
  getArrayOfElementsFromString,
};
