const { directoryResolver } = require("./resolver");
const path = require("path");

const buildExcludedPointsRegex = (excludedPointsArray) => {
  let regexStr = "";
  let regexSupportedStr = "",
    addressToRegexStr = "";
  let regexStrCount = 0,
    normalAddressCount = 0;
  excludedPointsArray.forEach((point) => {
    if (point instanceof RegExp) {
      regexSupportedStr += point.source + "|";
      regexStrCount++;
    } else {
      const pointAbsoluteAddress = directoryResolver(__dirname, point);
      addressToRegexStr += `${pointAbsoluteAddress}|`;
      normalAddressCount++;
    }
  });
  if (regexStrCount) {
    regexSupportedStr = regexSupportedStr.slice(0, -1);
  } else {
    regexSupportedStr = "!^()";
  }
  if (normalAddressCount) {
    addressToRegexStr = addressToRegexStr.slice(0, -1);
    addressToRegexStr = `^(${addressToRegexStr})`;
  } else addressToRegexStr = "!^()";
  regexStr = `${regexSupportedStr}|${addressToRegexStr}`;
  const excludedPointsRegex = new RegExp(regexStr);
  return excludedPointsRegex;
};

const buildIntraModuleDependencyRegex = (moduleLocation) => {
  const siblingLocation = path.join(path.dirname(moduleLocation), ".+");
  return new RegExp(`(?=^${siblingLocation})(?!^${moduleLocation})`);
};

module.exports = {
  buildExcludedPointsRegex,
  buildIntraModuleDependencyRegex,
};
