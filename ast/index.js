const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const { astParserPlugins, getDefaultFileObject } = require("./utility");
const {
  isExportFromTypeStatement,
  isFirstPartOfDynamicImports,
  isDynamicImportWithPromise,
  isRequireStatement,
} = require("./conditional-expressions-checks");
const {
  doIdentifierOperations,
  doAssignmentOperations,
  doImportDeclartionOperations,
  doExportDeclarationOperations,
  doDynamicImportWithPromiseOperations,
  doOperationsOnFirstPartOfDynamicImports,
} = require("./ast-operations");

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
    ImportDeclaration(path) {
      doImportDeclartionOperations(path.node, currentFileMetadata);
    },
    ExportNamedDeclaration(path) {
      if (isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata);
      }
    },
    ExportAllDeclaration(path) {
      if (isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata);
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
      if (isDynamicImportWithPromise(memberNode)) {
        doDynamicImportWithPromiseOperations(path, currentFileMetadata);
      } else if (isFirstPartOfDynamicImports(callExpressionNode)) {
        doOperationsOnFirstPartOfDynamicImports(path, currentFileMetadata);
      } else if (isRequireStatement(path.node)) {
        doAssignmentOperations(path.node, null, currentFileMetadata);
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
