const {
  traverseAST,
  buildAST,
  pathResolver,
  updateFilesMetadata,
  getDefaultFileObject,
} = require("./utility");

const checkUsingEntryFile = (relativeEntryFileAddress, filesMetadata) => {
  const entyFileLocation = pathResolver(__dirname, relativeEntryFileAddress);
  if (!filesMetadata.filesMapping[entyFileLocation]) {
    filesMetadata.filesMapping[entyFileLocation] =
      getDefaultFileObject(entyFileLocation);
  }
  
  filesMetadata.filesMapping[entyFileLocation].isEntryFile = true;
  if (
    !filesMetadata.VisitedFilesMapping[filesMetadata] &&
    /.(js|jsx|ts|tsx)$/.test(entyFileLocation)
  )
    traverseFile(entyFileLocation, filesMetadata);
};

const traverseFile = (fileLocation, filesMetadata) => {
  filesMetadata.VisitedFilesMapping[fileLocation] = true;
  let ast = buildAST(fileLocation);
  const currentFileMetadata = {
    entityMapping: {},
    importedFilesMapping: {},
    fileLocation,
  };
  traverseAST(ast, currentFileMetadata);
  ast = null;
  updateFilesMetadata(filesMetadata, currentFileMetadata);
  const importedFilesMapping = currentFileMetadata.importedFilesMapping;
  for (const file in importedFilesMapping) {
    if (
      !filesMetadata.VisitedFilesMapping[file] &&
      /.(js|jsx|ts|tsx)$/.test(file) &&
      !filesMetadata.excludedPointsRegex.test(file)
    ) {
      traverseFile(file, filesMetadata);
    } else if (
      !filesMetadata.filesMapping[file] &&
      !filesMetadata.excludedPointsRegex.test(file)
    ) {
      filesMetadata.filesMapping[file] = getDefaultFileObject(file);
    }
  }
};

module.exports = { checkUsingEntryFile };
