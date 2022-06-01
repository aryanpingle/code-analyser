const path = require("path");
const enhancedResolve = require("enhanced-resolve");
const { existsSync } = require("fs");

const enhancedResolver = new enhancedResolve.create.sync({
  extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts", ".spec.ts"],
});
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
    if (existsSync(directoryResolver(directoryName, fileAddress))) {
      return {
        type: "FOLDER",
        fileAddress: directoryResolver(directoryName, fileAddress),
      };
    }
    return { type: "INBUILT_NODE_MODULE", fileAddress };
  }
};
const directoryResolver = (directoryName, givenDirectoryAddress) => {
  if (!path.isAbsolute(givenDirectoryAddress))
    return path.join(directoryName, givenDirectoryAddress);
  return givenDirectoryAddress;
};

const isPathAbsolute = (pathToCheck) => path.isAbsolute(pathToCheck);

const getDirectoryFromPath = (pathToRetrieveFrom) =>
  path.dirname(pathToRetrieveFrom);

const getPredecessorDirectory = (
  pathToRetrieveFrom,
  distanceFromCurrentNode
) => {
  if (!distanceFromCurrentNode) return pathToRetrieveFrom;
  return path.dirname(pathToRetrieveFrom, distanceFromCurrentNode - 1);
};

module.exports = {
  pathResolver,
  directoryResolver,
  isPathAbsolute,
  getDirectoryFromPath,
  getPredecessorDirectory,
};
