const path = require("path");
const enhancedResolve = require("enhanced-resolve");
const { existsSync, statSync } = require("fs");
const { rootDirectory } = require("../code-analyser.config");

const isPathAbsolute = (pathToCheck) =>
  pathToCheck && path.isAbsolute(pathToCheck);

const isFilePath = (file) => {
  if (!file) return false;
  return statSync(file).isFile();
};

const getDirectoryFromPath = (pathToRetrieveFrom) =>
  path.dirname(pathToRetrieveFrom);

const directoryResolver = (directoryName, givenDirectoryAddress) => {
  if (!isPathAbsolute(givenDirectoryAddress)) {
    return path.join(directoryName, givenDirectoryAddress);
  }
  return givenDirectoryAddress;
};

const getPredecessorDirectory = (
  pathToRetrieveFrom,
  distanceFromCurrentNode
) => {
  if (distanceFromCurrentNode === 0) return pathToRetrieveFrom;
  return getPredecessorDirectory(
    getDirectoryFromPath(pathToRetrieveFrom),
    distanceFromCurrentNode - 1
  );
};

let settings;
try {
  const webpackConfigFileAddress = directoryResolver(
    directoryResolver(getPredecessorDirectory(__dirname, 2), rootDirectory),
    "webpack.config.js"
  );
  settings = require(webpackConfigFileAddress).resolve;
} catch (_) {
  settings = {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts", ".spec.ts"],
  };
}

const enhancedResolver = new enhancedResolve.create.sync(settings);

const pathResolver = (directoryName, fileAddress, pathType = "FILE") => {
  try {
    if (
      pathType === "FOLDER" &&
      existsSync(directoryResolver(directoryName, fileAddress))
    ) {
      return {
        type: "FOLDER",
        fileAddress: directoryResolver(directoryName, fileAddress),
      };
    }
    return {
      type: "FILE",
      fileAddress: enhancedResolver(directoryName, fileAddress),
    };
  } catch (_) {
    if (fileAddress && existsSync(directoryResolver(directoryName, fileAddress))) {
      return {
        type: "FOLDER",
        fileAddress: directoryResolver(directoryName, fileAddress),
      };
    }
    return { type: "INBUILT_NODE_MODULE", fileAddress };
  }
};

module.exports = {
  pathResolver,
  directoryResolver,
  isPathAbsolute,
  getDirectoryFromPath,
  getPredecessorDirectory,
  isFilePath,
};
