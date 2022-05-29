const path = require("path");
const enhancedResolve = require("enhanced-resolve");

const enhancedResolver = new enhancedResolve.create.sync({
  extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
});
const pathResolver = (directoryName, fileName) => {
  return enhancedResolver(directoryName, fileName);
};
const directoryResolver = (directoryName, givenDirectoryAddress) => {
  if (!path.isAbsolute(givenDirectoryAddress))
    return path.join(directoryName, givenDirectoryAddress);
  return givenDirectoryAddress;
};

const isPathAbsolute = (pathToCheck) => path.isAbsolute(pathToCheck);

const getDirectoryFromPath = (pathToRetrieveFrom) => path.dirname(pathToRetrieveFrom);

module.exports = { pathResolver, directoryResolver, isPathAbsolute, getDirectoryFromPath };
