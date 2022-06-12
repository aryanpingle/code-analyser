const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const fs = require("fs");
const { astParserPlugins, astOtherSettings } = require("./utility");
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
  doIdentifierOperationsOnImportedVariables,
  doIdentifierOperationsOnImportedVariablesMetadata,
} = require("./ast-operations");

/**
 * Builds the AST of the file, by first getting the file's code
 * @param {String} fileLocation Address of the file whose AST has to be build
 * @returns AST of the file's code
 */
const buildAST = (fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  try {
    return parse(code, {
      plugins: [...astParserPlugins, "jsx"],
      ...astOtherSettings,
    });
  } catch (_) {
    return parse(code, {
      plugins: astParserPlugins,
      ...astOtherSettings,
    });
  }
};

/**
 * Main function which actually traverse the AST of the file
 * @param {Object} traversalRelatedMetadata Metadata which contains information related to traversal like AST to traverse, current and all files' metadata
 * @param {String} type Traversal type (traverse according to requirement i.e. identifying deadfile/ intra-module dependencies)
 */
const traverseAST = (
  { ast, currentFileMetadata, filesMetadata, addReferences = true },
  type
) => {
  /* Takes two parameters ast and an object which contains types of nodes to visit as the key
     Will visit the entire AST but will report only for visited nodes provided inside the argument */
  traverse(ast, {
    // ImportDeclaration will check for "import ... from ..." type statements
    ImportDeclaration(path) {
      doImportDeclartionOperations(path.node, currentFileMetadata);
      if (type !== "CHECK_STATIC_IMPORTS_ADDRESSES") {
        doImportDeclartionOperationsAfterSetup(
          path.node,
          currentFileMetadata,
          filesMetadata,
          type,
          addReferences
        );
      }
      path.skip();
    },
    // Checks for "export * as ... from ...", "export ...", "export ... from ..." type statements
    ExportNamedDeclaration(path) {
      if (isExportFromTypeStatement(path.node)) {
        doExportDeclarationOperations(path.node, currentFileMetadata, type);
      }
      if (type === "CHECK_EXPORTS") {
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
      if (type === "CHECK_EXPORTS") {
        doExportSpecifiersOperations(
          path.node,
          currentFileMetadata,
          filesMetadata
        );
      }
    },
    // Checks for "export default ..." type statements
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
    MemberExpression(path) {
      if (type === "CHECK_USAGE" && isAccessingPropertyOfObject(path.node)) {
        // Checks for x.y or x["y"] type statements where parent's property is being accessed
        doAccessingPropertiesOfObjectOperations(
          path.node,
          currentFileMetadata,
          addReferences
        );
        path.skip();
      }
    },
    TSQualifiedName(path) {
      if (type === "CHECK_USAGE" && isAccessingPropertyOfObject(path.node)) {
        // Checks for x.y or x["y"] type statements where parent's property is being accessed
        doAccessingPropertiesOfObjectOperations(
          path.node,
          currentFileMetadata,
          addReferences
        );
        path.skip();
      }
    },
    VariableDeclarator(path) {
      if (
        type !== "CHECK_STATIC_IMPORTS_ADDRESSES" &&
        isRequireOrImportStatement(path.node.init)
      ) {
        // Checks for "const ... = require(...)", "const ... = import(...)" type statements
        doRequireOrImportStatementOperations(
          path.node.init,
          path.node.id,
          currentFileMetadata,
          filesMetadata,
          addReferences,
          type
        );
        path.skip();
      }
    },
    AssignmentExpression(path) {
      if (type !== "CHECK_STATIC_IMPORTS_ADDRESSES") {
        // Checks for "module.exports = {...}" type statements
        if (type === "CHECK_EXPORTS")
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
            addReferences,
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
      if (
        isDynamicImportWithPromise(memberNode) &&
        type !== "CHECK_STATIC_IMPORTS_ADDRESSES"
      ) {
        doDynamicImportWithPromiseOperations(
          path,
          currentFileMetadata,
          addReferences
        );
        if (type === "CHECK_USAGE")
          doDynamicImportWithPromiseOperationsAfterSetup(
            path,
            currentFileMetadata,
            filesMetadata,
            addReferences
          );
      }
      // Checks for "import(...)" type statements
      else if (
        isSubPartOfDynamicImport(callExpressionNode) &&
        type !== "CHECK_STATIC_IMPORTS_ADDRESSES"
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
          addReferences,
          type
        );
        path.skip();
      }
    },
    Identifier(path) {
      if (type !== "CHECK_STATIC_IMPORTS_ADDRESSES") {
        // Checks for variables names present in the code and if it is not used in export reference then will do the operation
        if (isNotExportTypeReference(path) && type === "CHECK_USAGE")
          doIdentifierOperationsOnImportedVariables(
            path,
            currentFileMetadata,
            addReferences
          );
        doIdentifierOperationsOnImportedVariablesMetadata(
          path,
          currentFileMetadata,
          addReferences
        );
      }
    },
    JSXIdentifier(path) {
      if (type !== "CHECK_STATIC_IMPORTS_ADDRESSES") {
        // Checks for variables names present in the code and if it is not used in export reference then will do the operation
        if (isNotExportTypeReference(path) && type === "CHECK_USAGE")
          doIdentifierOperationsOnImportedVariables(
            path,
            currentFileMetadata,
            addReferences
          );
        doIdentifierOperationsOnImportedVariablesMetadata(
          path,
          currentFileMetadata,
          addReferences
        );
      }
    },
  });
};

module.exports = {
  buildAST,
  traverseAST,
};
