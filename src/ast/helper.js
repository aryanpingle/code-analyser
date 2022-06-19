const { getCallExpressionFromNode } = require("./utility");
const {
  IMPORT,
  MEMBER_EXPRESSION,
  THEN,
  REQUIRE,
  MODULE,
  EXPORTS,
  TS_QUALIFIED_NAME,
  LEFT,
  OBJECT,
  IDENTIFIER,
  CHECK_ALL_IMPORTS_ADDRESSES,
  CHECK_STATIC_IMPORTS_ADDRESSES,
} = require("../utility/constants");

const isExportFromTypeStatement = (node) => node.source && node.source.value;

const isSubPartOfDynamicImport = (callExpressionNode) =>
  callExpressionNode.callee.type === IMPORT && callExpressionNode.arguments;

const isDynamicImportWithPromise = (memberNode) => {
  return (
    memberNode.type === MEMBER_EXPRESSION &&
    memberNode.object &&
    memberNode.object.callee &&
    memberNode.object.callee.type === IMPORT &&
    memberNode.property &&
    memberNode.property.name === THEN
  );
};

const isRequireOrImportStatement = (node) => {
  const callExpression = getCallExpressionFromNode(node);
  return (
    callExpression &&
    callExpression.callee &&
    (callExpression.callee.name === REQUIRE ||
      callExpression.callee.name === IMPORT)
  );
};

const isSpecifiersPresent = (node) =>
  node.specifiers && node.specifiers.length > 0;

const isImportStatementArgumentsPresent = (callExpressionNode) =>
  callExpressionNode.arguments.length &&
  callExpressionNode.arguments[0].params.length;

const isRequireStatement = (node) =>
  node.callee && node.callee.name === REQUIRE;

const isModuleExportStatement = (node) =>
  node.type === MEMBER_EXPRESSION &&
  node.object &&
  node.object.name === MODULE &&
  node.property &&
  node.property.name === EXPORTS;

const isAccessingPropertyOfObject = (node) => {
  let headNode = node;
  let typeToCheck, childPropertyToCheck;
  if (headNode.type === TS_QUALIFIED_NAME) {
    typeToCheck = TS_QUALIFIED_NAME;
    childPropertyToCheck = LEFT;
  } else {
    typeToCheck = MEMBER_EXPRESSION;
    childPropertyToCheck = OBJECT;
  }
  // while there still exists more than one property
  while (headNode && headNode.type === typeToCheck) {
    headNode = headNode[childPropertyToCheck];
  }
  if (!headNode) return false;
  return headNode.type === IDENTIFIER;
};

const isNotExportTypeReference = (path) => {
  const parentNode = path.findParent(
    (path) => path.isExportNamespaceSpecifier() || path.isExportSpecifier()
  );
  const assignmentNode = path.findParent((path) =>
    path.isAssignmentExpression()
  );
  const exportDefaultDeclaration = path.findParent((path) =>
    path.isExportDefaultDeclaration()
  );
  return !(
    // ES6 exports statements
    (
      parentNode ||
      // module.exports type statements
      (assignmentNode &&
        assignmentNode.node &&
        assignmentNode.node.left &&
        assignmentNode.node.left.object &&
        assignmentNode.node.left.object.name === MODULE &&
        assignmentNode.node.left.property &&
        assignmentNode.node.left.property.name === EXPORTS) ||
      // export default type statements
      (exportDefaultDeclaration &&
        exportDefaultDeclaration.node &&
        exportDefaultDeclaration.node.declaration &&
        (exportDefaultDeclaration.node.declaration.left === path.node ||
          exportDefaultDeclaration.node.declaration.id === path.node ||
          exportDefaultDeclaration.node.declaration === path.node ||
          (exportDefaultDeclaration.node.declaration.params &&
            exportDefaultDeclaration.node.declaration.params[0] === path.node)))
    )
  );
};

const isLazyImportDeclaration = (parentNode) =>
  parentNode &&
  parentNode.declarations &&
  parentNode.declarations[0] &&
  parentNode.declarations[0].id;

const isTraversingToCheckForImportAddresses = (traverseType) =>
  traverseType === CHECK_ALL_IMPORTS_ADDRESSES ||
  traverseType === CHECK_STATIC_IMPORTS_ADDRESSES;

const isNotTraversingToCheckForImportAddresses = (traverseType) =>
  !isTraversingToCheckForImportAddresses(traverseType);

const isNotTraversingToCheckForStaticImportAddresses = (traverseType) =>
  traverseType !== CHECK_STATIC_IMPORTS_ADDRESSES;

module.exports = {
  isExportFromTypeStatement,
  isSubPartOfDynamicImport,
  isDynamicImportWithPromise,
  isRequireOrImportStatement,
  isSpecifiersPresent,
  isImportStatementArgumentsPresent,
  isRequireStatement,
  isModuleExportStatement,
  isNotExportTypeReference,
  isAccessingPropertyOfObject,
  isLazyImportDeclaration,
  isTraversingToCheckForImportAddresses,
  isNotTraversingToCheckForImportAddresses,
  isNotTraversingToCheckForStaticImportAddresses,
};
