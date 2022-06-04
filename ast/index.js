const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const { astParserPlugins, getDefaultFileObject } = require("./utility");
const {
  isExportFromTypeStatement,
  isFirstPartOfDynamicImports,
  isDynamicImportWithPromise,
  isRequireStatement,
  isRequireOrImportStatement,
} = require("./conditional-expressions-checks");
const {
  doIdentifierOperations,
  doRequireOrImportStatementOperations,
  doImportDeclartionOperations,
  doExportDeclarationOperations,
  doDynamicImportWithPromiseOperations,
  doOperationsOnFirstPartOfDynamicImports,
  doModuleExportStatementOperations,
  doExportSpecifiersOperations,
  doImportDeclartionOperationsAfterSetup,
  doDynamicImportWithPromiseOperationsAfterSetup,
} = require("./ast-operations");

const buildAST = (fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  return parse(code, {
    sourceType: "module",
    plugins: astParserPlugins,
    errorRecovery: true,
  });
};

const traverseAST = (tree, currentFileMetadata, type, filesMetadata) => {
  traverse(tree, {
    ImportDeclaration(path) {
      if (type === "CHECK_IMPORTS")
        doImportDeclartionOperations(path.node, currentFileMetadata);
      else if (type === "CHECK_USAGE") {
        doImportDeclartionOperationsAfterSetup(
          path.node,
          currentFileMetadata,
          filesMetadata
        );
      }
      path.skip();
    },
    ExportNamedDeclaration(path) {
      if (type === "CHECK_IMPORTS" && isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata);
      } else {
        if (type === "CHECK_USAGE" && isExportFromTypeStatement(path.node)) {
          doImportDeclartionOperationsAfterSetup(
            path.node,
            currentFileMetadata,
            filesMetadata,
            "Export"
          );
        }
      }
      if (type === "CHECK_EXPORTS") {
        doExportSpecifiersOperations(
          path.node,
          currentFileMetadata,
          filesMetadata
        );
      }
    },
    ExportAllDeclaration(path) {
      if (type === "CHECK_IMPORTS" && isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata);
      } else {
        if (type === "CHECK_USAGE" && isExportFromTypeStatement(path.node)) {
          doImportDeclartionOperationsAfterSetup(
            path.node,
            currentFileMetadata,
            filesMetadata,
            "Export"
          );
        }
      }
      if (type === "CHECK_EXPORTS") {
        doExportSpecifiersOperations(
          path.node ,
          currentFileMetadata,
          filesMetadata
        );
      }
    },
    ExportDefaultDeclaration(path) {
      if (type === "CHECK_EXPORTS") {
        doExportSpecifiersOperations(
          path.node,
          currentFileMetadata,
          filesMetadata,
          "default"
        );
      }
    },
    VariableDeclarator(path) {
      if (type === "CHECK_IMPORTS" || type === "CHECK_USAGE") {
        if (isRequireOrImportStatement(path.node.init)) {
          doRequireOrImportStatementOperations(
            path.node.init,
            path.node.id,
            currentFileMetadata,
            filesMetadata,
            type
          );
          path.skip();
        }
      }
    },
    AssignmentExpression(path) {
      // if (type === "CHECK_IMPORTS") path.skip();
      if (type === "CHECK_IMPORTS" || type === "CHECK_USAGE") {
        if (isRequireOrImportStatement(path.node.right)) {
          doRequireOrImportStatementOperations(
            path.node.right,
            path.node.left,
            currentFileMetadata,
            filesMetadata,
            type
          );
          path.skip();
        }
      }
      if (type === "CHECK_EXPORTS") {
        doModuleExportStatementOperations(
          path.node.right,
          path.node.left,
          currentFileMetadata,
          filesMetadata
        );
      }
    },
    CallExpression(path) {
      // if (type === "CHECK_IMPORTS") path.skip();
      const callExpressionNode = path.node;
      const memberNode = callExpressionNode.callee;
      if (isDynamicImportWithPromise(memberNode)) {
        if (type === "CHECK_IMPORTS")
          doDynamicImportWithPromiseOperations(path, currentFileMetadata);
        else if (type === "CHECK_USAGE") {
          doDynamicImportWithPromiseOperationsAfterSetup(
            path,
            currentFileMetadata,
            filesMetadata
          );
        }
      } else if (isFirstPartOfDynamicImports(callExpressionNode)) {
        if (type === "CHECK_USAGE") {
          doOperationsOnFirstPartOfDynamicImports(
            path,
            currentFileMetadata,
            filesMetadata
          );
        }
      } else if (
        isRequireStatement(path.node) &&
        (type === "CHECK_IMPORTS" || type === "CHECK_USAGE")
      ) {
        if (isRequireOrImportStatement(path.node)) {
          doRequireOrImportStatementOperations(
            path.node,
            null,
            currentFileMetadata,
            filesMetadata,
            type
          );
        }
      }
    },
    Identifier(path) {
      if (type === "CHECK_USAGE") {
        doIdentifierOperations(path, currentFileMetadata);
      }
    },
    JSXIdentifier(path) {
      if (type === "CHECK_USAGE") {
        doIdentifierOperations(path, currentFileMetadata);
      }
    },
  });
};

module.exports = {
  buildAST,
  traverseAST,
  getDefaultFileObject,
};
