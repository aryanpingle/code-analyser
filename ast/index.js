const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const {
  getDirectoryFromPath,
} = require("../utility/resolver");
let i = 1;
const {
  astParserPlugins,
  getDefaultFileObject,
  doIdentifierOperations,
  setDefaultReferenceCount,
  updateSpecifierAndCurrentFileReferenceCount,
  isSpecifiersPresent,
  setRequiredVariablesObjects,
  isRequireStatement,
  getImportedFileAddress,
  getResolvedImportedFileDetails,
} = require("./utility");

const buildAST = (fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  return parse(code, {
    sourceType: "module",
    plugins: astParserPlugins,
    attachComment: false,
    errorRecovery: true,
  });
};

const traverseAST = (tree, currentFileMetadata) => {
  traverse(tree, {
    ImportDeclaration(astPath) {
      const fileLocation = currentFileMetadata.fileLocation;
      const givenSourceAdress = astPath.node.source.value;
      const { type, fileAddress: importedFileAddress } =
        getResolvedImportedFileDetails(
          givenSourceAdress,
          getDirectoryFromPath(fileLocation)
        );
      currentFileMetadata.importedFilesMapping[importedFileAddress] =
        getDefaultFileObject(importedFileAddress, type);

      if (isSpecifiersPresent(astPath.node)) {
        astPath.node.specifiers.forEach((specifier) => {
          updateSpecifierAndCurrentFileReferenceCount(
            specifier,
            currentFileMetadata,
            importedFileAddress
          );
        });
      } else {
        setDefaultReferenceCount(currentFileMetadata, importedFileAddress);
      }
    },
    VariableDeclarator(path) {
      if (isRequireStatement(path.node.init)) {
        const givenSourceAdress = getImportedFileAddress(path.node.init);
        const fileLocation = currentFileMetadata.fileLocation;
        const { type, fileAddress: importedFileAddress } =
          getResolvedImportedFileDetails(
            getDirectoryFromPath(fileLocation),
            givenSourceAdress,
          );
        currentFileMetadata.importedFilesMapping[importedFileAddress] =
          getDefaultFileObject(importedFileAddress, type);
        setRequiredVariablesObjects(
          path.node.id,
          currentFileMetadata,
          importedFileAddress
        );
      }
    },
    Identifier(path) {
      doIdentifierOperations(path, currentFileMetadata);
    },
    JSXIdentifier(path) {
      doIdentifierOperations(path, currentFileMetadata);
    },
  });
};

module.exports = {
  buildAST,
  traverseAST,
  getDefaultFileObject,
};
