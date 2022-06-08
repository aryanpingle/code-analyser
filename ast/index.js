const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const { astParserPlugins } = require("./utility");
const {
  isExportFromTypeStatement,
  isSubPartOfDynamicImport,
  isDynamicImportWithPromise,
  isRequireStatement,
  isRequireOrImportStatement,
  isAccessingPropertyOfObject,
  isNotExportTypeReference,
} = require("./conditional-expressions-checks");
const {
  doIdentifierOperations,
  doRequireOrImportStatementOperations,
  doImportDeclartionOperations,
  doExportDeclarationOperations,
  doDynamicImportWithPromiseOperations,
  doOperationsOnSubPartOfDynamicImports,
  doModuleExportStatementOperations,
  doExportSpecifiersOperations,
  doImportDeclartionOperationsAfterSetup,
  doDynamicImportWithPromiseOperationsAfterSetup,
  doDynamicImportsUsingLazyHookOperations,
  doAccessingPropertiesOfObjectOperations,
} = require("./ast-operations");

/**
 * Builds the AST of the file, by first getting the file's code
 * @param {String} fileLocation Address of the file whose AST has to be build
 * @returns AST of the file's code
 */
const buildAST = (fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  return parse(code, {
    sourceType: "module",
    plugins: astParserPlugins,
    errorRecovery: true,
  });
};

/**
 * Main function which actually traverse the AST of the file
 * @param {Object} traversalRelatedMetadata Metadata which contains information related to traversal like AST to traverse, current and all files' metadata
 * @param {String} type Traversal type (traverse according to requirement i.e. identifying deadfile/ intra-module dependencies)
 */
const traverseAST = ({ ast, currentFileMetadata, filesMetadata }, type) => {
  /* Takes two parameters ast and an object which contains types of nodes to visit as the key
     Will visit the entire AST but will report only for visited nodes provided inside the argument */
  traverse(ast, {
    // ImportDeclaration will check for "import ... from ..." type statements
    ImportDeclaration(path) {
      doImportDeclartionOperations(path.node, currentFileMetadata);
      if (type === "CHECK_USAGE") {
        doImportDeclartionOperationsAfterSetup(
          path.node,
          currentFileMetadata,
          filesMetadata
        );
      }
      path.skip();
    },
    // Checks for "export * as ... from ...", "export ...", "export ... from ..." type statements
    ExportNamedDeclaration(path) {
      if (isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata, type);
      }
      if (type === "CHECK_USAGE") {
        doExportSpecifiersOperations(
          path.node,
          currentFileMetadata,
          filesMetadata
        );
      }
    },
    // Checks for "export * from ..." type statements
    ExportAllDeclaration(path) {
      if (isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata, type);
      }
      if (type === "CHECK_USAGE") {
        doExportSpecifiersOperations(
          path.node,
          currentFileMetadata,
          filesMetadata
        );
      }
    },
    // Checks for "export default ..." type statements
    ExportDefaultDeclaration(path) {
      if (type === "CHECK_USAGE") {
        doExportSpecifiersOperations(
          path.node,
          currentFileMetadata,
          filesMetadata,
          "default"
        );
      }
    },
    MemberExpression(path) {
      if (type === "CHECK_USAGE") {
        if (isAccessingPropertyOfObject(path.node)) {
          // Checks for x.y or x["y"] type statements where parent's property is being accessed
          doAccessingPropertiesOfObjectOperations(
            path.node,
            currentFileMetadata
          );
          path.skip();
        }
      }
    },
    VariableDeclarator(path) {
      if (
        type === "CHECK_USAGE" &&
        isRequireOrImportStatement(path.node.init)
      ) {
        // Checks for "const ... = require(...)", "const ... = import(...)" type statements
        doRequireOrImportStatementOperations(
          path.node.init,
          path.node.id,
          currentFileMetadata,
          filesMetadata,
          type
        );
        path.skip();
      }
    },
    AssignmentExpression(path) {
      if (type === "CHECK_USAGE") {
        // Checks for "module.exports = {...}" type statements
        doModuleExportStatementOperations(
          path.node.right,
          path.node.left,
          currentFileMetadata,
          filesMetadata
        );
        // Checks for "... = require(...)",  "... = import(...)"" type statements
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
    },
    CallExpression(path) {
      const callExpressionNode = path.node;
      const memberNode = callExpressionNode.callee;
      // Checks for "import(...).then((...)=>...)" type statements
      if (isDynamicImportWithPromise(memberNode) && type === "CHECK_USAGE") {
        doDynamicImportWithPromiseOperations(path, currentFileMetadata, type);
        doDynamicImportWithPromiseOperationsAfterSetup(
          path,
          currentFileMetadata,
          filesMetadata
        );
        path.skip();
      }
      // Checks for "import(...)" type statements
      else if (
        isSubPartOfDynamicImport(callExpressionNode) &&
        (type === "CHECK_USAGE" || type === "CHECK_IMPORTED_FILES_ADDRESSES")
      ) {
        doOperationsOnSubPartOfDynamicImports(
          path,
          currentFileMetadata,
          filesMetadata,
          type
        );
        const parentAssignmentPath = path.findParent(
          (path) =>
            path.isVariableDeclaration() || path.isAssignmentExpression()
        );
        if (parentAssignmentPath) {
          // Checks for "const ... = lazy(()=>import(...))" type statements
          doDynamicImportsUsingLazyHookOperations(
            parentAssignmentPath.node,
            path.node,
            currentFileMetadata,
            filesMetadata,
            type
          );
        }
      }
      // Checks for "require(...)" type statements
      else if (isRequireStatement(path.node)) {
        doRequireOrImportStatementOperations(
          path.node,
          null,
          currentFileMetadata,
          filesMetadata,
          type
        );
        path.skip();
      }
    },
    Identifier(path) {
      if (type === "CHECK_USAGE") {
        // Checks for variables names present in the code and if it is not used in export reference then will do the operation
        if (isNotExportTypeReference(path))
          doIdentifierOperations(path, currentFileMetadata);
      }
    },
    JSXIdentifier(path) {
      if (type === "CHECK_USAGE") {
        // Checks for variables names present in the code and if it is not used in export reference then will do the operation
        if (isNotExportTypeReference(path))
          doIdentifierOperations(path, currentFileMetadata);
      }
    },
  });
};

module.exports = {
  buildAST,
  traverseAST,
};
