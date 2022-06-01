const { getCallExpressionFromNode } = require("./utility");

const isExportFromTypeStatement = (node) => node.source && node.source.value;
const isFirstPartOfDynamicImports = (callExpressionNode) =>
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
const isFileMappingNotPresentInCurrentFile = (
  fileAddress,
  currentFileMetadata
) => !currentFileMetadata.importedFilesMapping[fileAddress];
const isSpecifiersPresent = (node) => node.specifiers && node.specifiers.length;
const isImportStatementArgumentsPresent = (callExpressionNode) =>
  callExpressionNode.arguments.length &&
  callExpressionNode.arguments[0].params.length;
const isRequireStatement = (node) => node.callee && node.callee.name === "require";

module.exports = {
  isExportFromTypeStatement,
  isFirstPartOfDynamicImports,
  isDynamicImportWithPromise,
  isRequireOrImportStatement,
  isFileMappingNotPresentInCurrentFile,
  isSpecifiersPresent,
  isImportStatementArgumentsPresent,
  isRequireStatement
};
