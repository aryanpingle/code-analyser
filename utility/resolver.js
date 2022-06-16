const path = require("path");
const enhancedResolve = require("enhanced-resolve");
const { existsSync, statSync } = require("fs");
const codeAnalyerConfigurationObject = require("./configuration-object");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const JsConfigPathsPlugin = require("jsconfig-paths-webpack-plugin");
const process = require("process");

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

const settings = {
  extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts", ".spec.ts"],
  modules: ["src", "node_modules"],
  plugins: [],
};

// Improving resolver if root directory provided
if (codeAnalyerConfigurationObject.rootDirectory)
  ["jsconfig.json", "tsconfig.json"].forEach((file, index) => {
    const resolvedPath = resolveAddressWithProvidedDirectory(
      resolveAddressWithProvidedDirectory(
        process.cwd(),
        codeAnalyerConfigurationObject.rootDirectory
      ),
      file
    );
    if (isFilePath(resolvedPath)) {
      if (index)
        settings.plugins.push(
          new TsconfigPathsPlugin({
            configFile: resolvedPath,
          })
        );
      else
        settings.plugins.push(
          new JsConfigPathsPlugin({ configFile: resolvedPath })
        );
    }
  });

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
 * Will find all sub-parts present in a given path
 * For eg. path: A/B/C/D -> returned value [A, B, C, D]
 * @param {String} givenPath Absolute address of the path from which sub-parts have to be retrieved
 * @returns Array consisting of all sub-parts (in order) of the given path
 */
const getAllSubPartsOfGivenAbsolutePath = (givenPath) => {
  const subPartsArray = [];
  let pathToRetrieveFrom = givenPath;
  while (pathToRetrieveFrom.length > 1) {
    subPartsArray.unshift(getPathBaseName(pathToRetrieveFrom));
    pathToRetrieveFrom = getDirectoryFromPath(pathToRetrieveFrom);
  }
  subPartsArray.unshift("");
  return subPartsArray;
};

/**
 * Will join together the sub-parts to form an absolute address which contains at most given depth's sub parts
 * @param {Array} subPartsArray Array consisting of sub-parts
 * @param {Integer} depth Will be used to decide till what level sub-parts should be present
 * @returns Absolute address joined using the provided array and depth
 */
const joinSubPartsTillGivenDepth = (subPartsArray, depth) => {
  const arrayAtGivenDepth = subPartsArray.filter((_, index) => index < depth);
  const pathAtGivenDepth = arrayAtGivenDepth.reduce(
    (reducer, subPart) => path.join(reducer, subPart),
    " "
  );
  return pathAtGivenDepth.trim();
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
  getAllSubPartsOfGivenAbsolutePath,
  joinSubPartsTillGivenDepth,
};
