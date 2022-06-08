const { getCallExpressionFromNode } = require("./utility");

const isExportFromTypeStatement = (node) => node.source && node.source.value;

const isSubPartOfDynamicImport = (callExpressionNode) =>
  callExpressionNode.callee.type === "Import" && callExpressionNode.arguments;

const isDynamicImportWithPromise = (memberNode) => {
  return (
    memberNode.type === "MemberExpression" &&
    memberNode.object &&
    memberNode.object.callee &&
    memberNode.object.callee.type === "Import" &&
    memberNode.property &&
    memberNode.property.name === "then"
  );
};

const isRequireOrImportStatement = (node) => {
  const callExpression = getCallExpressionFromNode(node);
  return (
    callExpression &&
    callExpression.callee &&
    (callExpression.callee.name === "require" ||
      callExpression.callee.name === "import")
  );
};

const isSpecifiersPresent = (node) => node.specifiers && node.specifiers.length;

const isImportStatementArgumentsPresent = (callExpressionNode) =>
  callExpressionNode.arguments.length &&
  callExpressionNode.arguments[0].params.length;

const isRequireStatement = (node) =>
  node.callee && node.callee.name === "require";

const isModuleExportStatement = (node) =>
  node.type === "MemberExpression" &&
  node.object &&
  node.object.name === "module" &&
  node.property &&
  node.property.name === "exports";

const isAccessingPropertyOfObject = (node) => {
  let headNode = node;
  let typeToCheck, childPropertyToCheck;
  if (headNode.type === "TSQualifiedName") {
    typeToCheck = "TSQualifiedName";
    childPropertyToCheck = "left";
  } else {
    typeToCheck = "MemberExpression";
    childPropertyToCheck = "object";
  }
  // while there still exists more than one property
  while (headNode && headNode.type === typeToCheck) {
    headNode = headNode[childPropertyToCheck];
  }
  if (!headNode) return false;
  return headNode.type === "Identifier";
};

const isNotExportTypeReference = (path) => {
  const parentNode = path.findParent(
    (path) => path.isExportNamespaceSpecifier() || path.isExportSpecifier()
  );
  const assignmentNode = path.findParent((path) =>
    path.isAssignmentExpression()
  );
  return !(
    parentNode ||
    (assignmentNode &&
      assignmentNode.node &&
      assignmentNode.node.left &&
      assignmentNode.node.left.object &&
      assignmentNode.node.left.object.name === "module" &&
      assignmentNode.node.left.property &&
      assignmentNode.node.left.property.name === "exports")
  );
};

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
};
