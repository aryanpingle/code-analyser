const path = require("path");
const enhancedResolve = require("enhanced-resolve");
const { existsSync, statSync } = require("fs");
const { rootDirectory } = require("../code-analyser.config");

/**
 * Checks if the given path is absolute or not
 * @param {String} pathToCheck Path of the required module to check
 * @returns Boolean value denoting whether the given path is absolute or not
 */
const isPathAbsolute = (pathToCheck) =>
  pathToCheck && path.isAbsolute(pathToCheck);

/**
 * Returns the provided path's directory address
 * @param {String} pathToRetrieveFrom
 * @returns Address of the path's directory
 */
const getDirectoryFromPath = (pathToRetrieveFrom) =>
  path.dirname(pathToRetrieveFrom);

/**
 * Function to get the address of a ancestor directory of the provided path
 * @param {String} pathToRetrieveFrom Given path from which the predecessor directory's path will be retrieved
 * @param {Integer} depthFromCurrentNode Smallest distance between the ancestor and current nodes
 * @returns Address of the ancestory directory of the provided path at the given depth
 */
const getPredecessorDirectory = (pathToRetrieveFrom, depthFromCurrentNode) => {
  // If current node is the required ancestor node
  if (depthFromCurrentNode === 0) return pathToRetrieveFrom;
  // Else recursicely traverse this node with one less depth
  return getPredecessorDirectory(
    getDirectoryFromPath(pathToRetrieveFrom),
    depthFromCurrentNode - 1
  );
};

/**
 * Resolves the address and returns an absolute path to that module
 * @param {String} parentDirectoryAddress Absolute address of the module's parent directory
 * @param {String} givenModuleAddress Given module's path
 * @returns Absolute address of the required module
 */
const resolveAddressWithProvidedDirectory = (
  parentDirectoryAddress,
  givenModuleAddress
) => {
  if (isPathAbsolute(givenModuleAddress)) return givenModuleAddress;
  return path.join(parentDirectoryAddress, givenModuleAddress);
};

let settings;

try {
  // If the provided root directory (in the configuration file contains a webpack.config.js file then set resolver's settings equal to it's provided resolve
  const webpackConfigFileAddress = resolveAddressWithProvidedDirectory(
    resolveAddressWithProvidedDirectory(
      getPredecessorDirectory(__dirname, 1),
      rootDirectory
    ),
    "webpack.config.js"
  );
  settings = require(webpackConfigFileAddress).resolve;
} catch (_) {
  settings = {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts", ".spec.ts"],
    modules: ["src", "node_modules"]
  };
}

const enhancedResolver = new enhancedResolve.create.sync(settings);

/**
 * Function will resolve the address of the required file using it's directory and file addresses
 * @param {String} directoryAddress Absolute address of the required file/ folder's directory
 * @param {String} fileAddress Given path of the file (relative, absolute, node module)
 * @param {String} pathType Provided type of path (either FILE or UNRESOLVED TYPE), default: FILE
 * @returns Resolved path of the given address
 */
const pathResolver = (directoryAddress, fileAddress, pathType = "FILE") => {
  try {
    // Unresolved type is given to the paths which are declared using template literals (They can be dynamic strings)
    if (
      pathType === "UNRESOLVED TYPE" &&
      isGivenPathPresent(
        resolveAddressWithProvidedDirectory(directoryAddress, fileAddress)
      )
    ) {
      return {
        type: "UNRESOLVED TYPE",
        fileAddress: resolveAddressWithProvidedDirectory(
          directoryAddress,
          fileAddress
        ),
      };
    }
    return {
      type: "FILE",
      fileAddress: enhancedResolver(directoryAddress, fileAddress),
    };
  } catch (_) {
    if (
      fileAddress &&
      isGivenPathPresent(
        resolveAddressWithProvidedDirectory(directoryAddress, fileAddress)
      )
    ) {
      // If this path exists, then it means the program is unable to resolve it's type (file/ folder)
      return {
        type: "UNRESOLVED TYPE",
        fileAddress: resolveAddressWithProvidedDirectory(
          directoryAddress,
          fileAddress
        ),
      };
    }
    return { type: "INBUILT_NODE_MODULE", fileAddress };
  }
};

/**
 * Checks if the provided path actually exists or not
 * @param {String} givenPath Path which has to be checked
 * @returns Boolean value which denotes whether the path is present or not
 */
const isGivenPathPresent = (givenPath) => givenPath && existsSync(givenPath);

/**
 * Checks if the given path represents a file
 * @param {String} givenPath Address to check
 * @returns Boolean value denoting whether the path is a file's address or not
 */
const isFilePath = (givenPath) => {
  if (isGivenPathPresent(givenPath)) return statSync(givenPath).isFile();
  return false;
};

const getPathBaseName = (fileLocation) => path.basename(fileLocation);

module.exports = {
  pathResolver,
  resolveAddressWithProvidedDirectory,
  isPathAbsolute,
  getDirectoryFromPath,
  getPredecessorDirectory,
  isFilePath,
  getPathBaseName,
};
