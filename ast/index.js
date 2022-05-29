const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const {
  pathResolver,
  isPathAbsolute,
  getDirectoryFromPath,
} = require("../utility/resolver");
const {
  astParserPlugins,
  getDefaultFileObject,
  doIdentifierOperations,
  setDefaultReferenceCount,
  updateSpecifierAndCurrentFileReferenceCount,
  isSpecifiersPresent,
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
      const importedFileAddress = isPathAbsolute(givenSourceAdress)
        ? givenSourceAdress
        : pathResolver(getDirectoryFromPath(fileLocation), givenSourceAdress);

      currentFileMetadata.importedFilesMapping[importedFileAddress] =
        getDefaultFileObject(importedFileAddress);

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
