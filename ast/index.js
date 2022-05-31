const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const { getDirectoryFromPath } = require("../utility/resolver");
const {
  astParserPlugins,
  getDefaultFileObject,
  doIdentifierOperations,
  setDefaultReferenceCount,
  updateSpecifierAndCurrentFileReferenceCount,
  isSpecifiersPresent,
  setRequiredVariablesObjects,
  getImportedFileAddress,
  getResolvedImportedFileDetails,
  isMemberNodeAndImportStatement,
  parseComment,
  updateWebpackConfigurationOfImportedFile,
  doAssignmentOperations,
} = require("./utility");

const buildAST = (fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  return parse(code, {
    sourceType: "module",
    plugins: astParserPlugins,
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
          getDirectoryFromPath(fileLocation),
          givenSourceAdress
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
      doAssignmentOperations(path.node.init, path.node.id, currentFileMetadata);
    },
    AssignmentExpression(path) {
      doAssignmentOperations(
        path.node.right,
        path.node.left,
        currentFileMetadata
      );
    },
    CallExpression(path) {
      const callExpressionNode = path.node;
      const memberNode = callExpressionNode.callee;

      if (isMemberNodeAndImportStatement(memberNode)) {
        const { type: importType, address: givenSourceAdress } =
          getImportedFileAddress(memberNode.object);
        const fileLocation = currentFileMetadata.fileLocation;
        const { type, fileAddress: importedFileAddress } =
          getResolvedImportedFileDetails(
            getDirectoryFromPath(fileLocation),
            givenSourceAdress,
            importType
          );
        if (!currentFileMetadata.importedFilesMapping[importedFileAddress])
          currentFileMetadata.importedFilesMapping[importedFileAddress] =
            getDefaultFileObject(importedFileAddress, type);
        if (
          callExpressionNode.arguments &&
          callExpressionNode.arguments[0].params
        )
          setRequiredVariablesObjects(
            callExpressionNode.arguments[0].params[0],
            currentFileMetadata,
            importedFileAddress
          );
      } else if (
        callExpressionNode.callee.type === "Import" &&
        callExpressionNode.arguments
        // callExpressionNode.arguments[0].leadingComments
      ) {
        const { type: importType, address: givenSourceAdress } =
          getImportedFileAddress(callExpressionNode);
        const fileLocation = currentFileMetadata.fileLocation;
        const { fileAddress: importedFileAddress } =
          getResolvedImportedFileDetails(
            getDirectoryFromPath(fileLocation),
            givenSourceAdress,
            importType
          );
        const webpackConfiguration = {
          webpackChunkName: importedFileAddress,
          webpackPath: importedFileAddress,
          webpackInclude: /^()/,
          webpackExclude: /!^()/,
        };
        // console.log(webpackConfiguration);
        const leadingCommentsArray =
          callExpressionNode.arguments[0].leadingComments;
        if (leadingCommentsArray) {
          leadingCommentsArray.forEach((comment) => {
            const commentSubParts = comment.value.split(":");
            if (commentSubParts.length === 2) {
              const { key, value } = parseComment(commentSubParts);
              webpackConfiguration[key] = value;
            }
          });
        }
        updateWebpackConfigurationOfImportedFile(
          currentFileMetadata,
          importedFileAddress,
          webpackConfiguration
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
  // if (/App/.test(currentFileMetadata.fileLocation))
  // console.log(currentFileMetadata.importedFilesMapping, currentFileMetadata.fileLocation);
};

module.exports = {
  buildAST,
  traverseAST,
  getDefaultFileObject,
};
