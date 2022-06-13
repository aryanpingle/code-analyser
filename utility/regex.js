const {
  resolveAddressWithProvidedDirectory,
  joinSubPartsTillGivenDepth,
  getDirectoryFromPath,
  getAllSubPartsOfGivenAbsolutePath,
} = require("./resolver");
const {
  isInstanceofRegexExpression,
} = require("./conditional-expressions-checks");

/**
 * Builds a regex which excludes files based on input given in the configuration file initially
 * @param {Array} excludedModulesArray Array consisting of paths/ regex expressions of files/ directories which have to be exlcuded
 * @returns Regex denoting the excluded files
 */
const buildExcludedFilesRegex = (excludedModulesArray) => {
  let regexElementsString = "",
    addressToRegexString = "";
  let pathWithRegexReferenceCount = 0,
    pathWithoutRegexReferenceCount = 0;
  excludedModulesArray.forEach((file) => {
    if (isInstanceofRegexExpression(file)) {
      // Add "|" to set the regex as either match this regex or some other regex
      regexElementsString += `${file.source}|`;
      pathWithRegexReferenceCount++;
    } else {
      const moduleAbsoluteAddress = resolveAddressWithProvidedDirectory(
        getDirectoryFromPath(__dirname),
        file
      );
      // Either match this module's address or another module's address
      addressToRegexString += `${convertAddressIntoRegexCompatibleFormat(
        moduleAbsoluteAddress
      )}|`;
      pathWithoutRegexReferenceCount++;
    }
  });
  if (pathWithRegexReferenceCount) {
    // Remove the last "|" from the string
    regexElementsString = regexElementsString.slice(0, -1);
  } else {
    // If no references then disallo any file to match with this regex
    regexElementsString = "!^()";
  }
  if (pathWithoutRegexReferenceCount) {
    addressToRegexString = addressToRegexString.slice(0, -1);
    // If there exists a file which starts with the addressToRegexString's regex, then exclude it
    addressToRegexString = `^(${addressToRegexString})`;
  } else addressToRegexString = "!^()";
  // Either match the regex provided or provided modules paths
  const regexInStringFormat = `${regexElementsString}|${addressToRegexString}`;
  const excludedPointsRegex = new RegExp(regexInStringFormat);
  return excludedPointsRegex;
};

/**
 * Build a regex which will be used to set the intra-module dependencies' required condition
 * @param {String} moduleLocation Absolute/ Relative path of the module whose intra-module dependencies are required
 * @param {Boolean} isDepthFromFront To check whether the depth has to be measured from front or back
 * @param {Integer} depth Depth at which intra-module dependencies should be checked
 * @returns Regex containg the intra-module dependencies required condition
 */
const buildIntraModuleDependencyRegex = (
  moduleLocation,
  isDepthFromFront,
  depth
) => {
  const pathSubPartsArray = getAllSubPartsOfGivenAbsolutePath(moduleLocation);
  const pathSubPartsArrayLength = pathSubPartsArray.length;
  const resolvedDepth = isDepthFromFront
    ? depth + 1
    : pathSubPartsArrayLength - depth;
  // Directory containg the required module which is at depth = resolvedDepth from the provided module's location
  const directoryToCheckAtGivenDepth = joinSubPartsTillGivenDepth(
    pathSubPartsArray,
    resolvedDepth + 1
  )
  // Address of the sibling modules of the module's directory at the given depth
  const siblingLocation = joinSubPartsTillGivenDepth(
    pathSubPartsArray,
    resolvedDepth
  );
  const regexCompatibleSiblingLocation = resolveAddressWithProvidedDirectory(
    convertAddressIntoRegexCompatibleFormat(siblingLocation),
    ".+"
  );
  const regexCompatibleDirectoryLocation =
    convertAddressIntoRegexCompatibleFormat(directoryToCheckAtGivenDepth);
  // Regex denotes any module which starts with the siblingLocation's path but doesn't start with module's ancestor directory at the given depth
  return new RegExp(
    `(?=^${regexCompatibleSiblingLocation})(?!^${regexCompatibleDirectoryLocation})`
  );
};

/**
 * Converts the given address into a format whose meaning will not change when placed inside a regex expression
 * @param {String} addressString
 * @returns Regex compatible address string
 */
const convertAddressIntoRegexCompatibleFormat = (addressString) => {
  let convertedAddress = "";
  for (const character of addressString) {
    // Use regex to check for any special character used
    convertedAddress += /[\/\[\]\*\+\?\.\|\^\{\}\-\$\,]/.test(character)
      ? `\\${character}`
      : character;
  }
  return convertedAddress;
};
module.exports = {
  buildExcludedFilesRegex,
  buildIntraModuleDependencyRegex,
};
