const {
  traverseAST,
  buildAST,
  directoryResolver,
  allFilesFinder,
  deadFilesFinder,
  updateFilesMetadata,
  getDefaultFileObject,
} = require("../utility/filesfinder");

const checkUsingDirectoryAddress = async (
  relativeDirectoryAddress,
  filesMetadata
) => {

  const directoryLocation = directoryResolver(__dirname, relativeDirectoryAddress);

  const traverseFile = (fileLocation) => {
    const ast = buildAST(fileLocation);
    const currentFileMetadata = {
      entityMapping: {},
      importedFilesMapping: {},
      fileLocation,
    };
    traverseAST(ast, currentFileMetadata, filesMetadata);
    ast = null;
    updateFilesMetadata(filesMetadata, currentFileMetadata);
  };
  const allFiles = await allFilesFinder(directoryLocation);
  
  allFiles.forEach((fileName) => {
    filesMetadata.visitedFilesMapping[fileName] = true;
    if (!filesMetadata.filesMapping[fileName])
      filesMetadata.filesMapping[fileName] = getDefaultFileObject(fileName);
    if (/.(js|jsx|ts|tsx)$/.test(fileName)) {
      traverseFile(fileName);
    }
  });
  const directoryToCheck = directoryLocation;
  const deadFiles = deadFilesFinder(filesMetadata, directoryToCheck);
  console.log(filesMetadata);
  return deadFiles;
};
module.exports = { checkUsingDirectoryAddress };
