const path = require("path");
const { pathResolver, isPathAbsolute } = require("../utility/resolver");
const { getDirectoryFromPath } = require("../utility/resolver");
const astParserPlugins = [
  "jsx",
  ["typescript", { dts: true }],
  ["pipelineOperator", { proposal: "minimal" }],
  "asyncDoExpressions",
  "decimal",
  "decorators-legacy",
  "decoratorAutoAccessors",
  "destructuringPrivate",
  "doExpressions",
  "exportDefaultFrom",
  "functionBind",
  "importAssertions",
  "moduleBlocks",
  "partialApplication",
  "regexpUnicodeSets",
  "throwExpressions",
  "asyncGenerators",
  "bigInt",
  "classProperties",
  "classPrivateProperties",
  "classPrivateMethods",
  "classStaticBlock",
  "dynamicImport",
  "exportNamespaceFrom",
  "functionSent",
  "logicalAssignment",
  "moduleStringNames",
  "nullishCoalescingOperator",
  "numericSeparator",
  "objectRestSpread",
  "optionalCatchBinding",
  "optionalChaining",
  "privateIn",
  "topLevelAwait",
];

const getDefaultFileObject = (fileLocation, type = "FILE") => {
  return {
    name: path.basename(fileLocation),
    type,
    fileLocation: fileLocation,
    referencedCount: 0,
    importReferenceCount: 0,
    isEntryFile: false,
    webpackChunkConfiguration: {
      default: {
        webpackChunkName: "default",
        webpackInclude: /^()/,
        webpackExclude: /!^()/,
        webpackPath: fileLocation,
      },
    },
  };
};

const doIdentifierOperations = (path, currentFileMetadata) => {
  const identifierName = path.node.name;
  if (currentFileMetadata.entityMapping[identifierName]) {
    try {
      currentFileMetadata.entityMapping[identifierName].referenceCount++;
      const importedFrom =
        currentFileMetadata.entityMapping[identifierName].importedFrom;
      currentFileMetadata.importedFilesMapping[importedFrom].referencedCount++;
    } catch (_) {}
  }
};

const setDefaultReferenceCount = (currentFileMetadata, importedFileAddress) => {
  currentFileMetadata.importedFilesMapping[
    importedFileAddress
  ].referencedCount = 2;
  currentFileMetadata.importedFilesMapping[
    importedFileAddress
  ].importReferenceCount = 1;
};

const updateSpecifierAndCurrentFileReferenceCount = (
  specifier,
  currentFileMetadata,
  importedFileAddress
) => {
  const localEntityName = specifier.local.name;
  let importedEntityName;
  let importReferenceCount;
  if (specifier.type === "ImportSpecifier") {
    importedEntityName = specifier.imported.name;
  }
  importReferenceCount = importedEntityName === localEntityName ? 2 : 1;
  currentFileMetadata.importedFilesMapping[
    importedFileAddress
  ].importReferenceCount += importReferenceCount;
  currentFileMetadata.entityMapping[localEntityName] = {
    name: importedEntityName,
    localName: localEntityName,
    importedFrom: importedFileAddress,
    referenceCount: 0,
    importReferenceCount,
  };
};

const setRequiredVariablesObjects = (
  node,
  currentFileMetadata,
  importedFileAddress
) => {
  if (node.type === "Identifier") {
    const localEntityName = node.name;
    currentFileMetadata.entityMapping[localEntityName] = {
      name: "default",
      localName: localEntityName,
      importedFrom: importedFileAddress,
      referenceCount: 0,
      importReferenceCount: 1,
    };
    currentFileMetadata.importedFilesMapping[
      importedFileAddress
    ].importReferenceCount += 1;
  } else if (node.type === "ObjectPattern" || node.type === "ArrayPattern") {
    const patternToCheck =
      node.type === "ObjectPattern" ? node.properties : node.elements;
    patternToCheck.forEach((property) => {
      const importedEntityName = getImportedNameFromProperty(property);
      const localEntityName = getLocalNameFromProperty(property);
      const importReferenceCount =
        importedEntityName === localEntityName && node.type === "ObjectPattern"
          ? 2
          : 1;
      currentFileMetadata.entityMapping[localEntityName] = {
        name: importedEntityName,
        localName: localEntityName,
        importedFrom: importedFileAddress,
        referenceCount: 0,
        importReferenceCount,
      };
      currentFileMetadata.importedFilesMapping[
        importedFileAddress
      ].importReferenceCount += importReferenceCount;
    });
  }
};
const getLocalNameFromProperty = (property) => {
  if (property.type === "ObjectProperty") return property.value.name;
  else if (property.type === "Identifier") return property.name;
  else return "default";
};

const getImportedNameFromProperty = (property) => {
  if (property.type === "ObjectProperty") return property.key.name;
  else if (property.type === "Identifier") return property.name;
  else return "default";
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

const getCallExpressionFromNode = (node) => {
  let callExpression;
  if (!node) return callExpression;
  if (node.type === "CallExpression") callExpression = node;
  else if (node.type === "MemberExpression") callExpression = node.object;
  else if (node.type === "AwaitExpression") callExpression = node.argument;
  return callExpression;
};

const getImportedFileAddress = (node) => {
  const callExpression = getCallExpressionFromNode(node);
  return getValueFromStringOrTemplateLiteral(callExpression.arguments[0]);
};
const getValueFromStringOrTemplateLiteral = (argument) => {
  if (argument.type === "StringLiteral")
    return { type: "FILE", address: argument.value };
  else if (argument.type === "TemplateLiteral" && argument.quasis.length)
    return {
      type: "FOLDER",
      address: getLastFeasibleAddress(argument.quasis[0].value.cooked),
    };
  else return { type: "NONE" };
};
const getLastFeasibleAddress = (path) => {
  return path.replace(/(.{2,})\/(.*)$/, "$1");
};
const getResolvedImportedFileDetails = (
  directoryAddress,
  fileAddress,
  importType = "FILE"
) => {
  if (isPathAbsolute(fileAddress)) return { type: "FILE", fileAddress };
  return pathResolver(directoryAddress, fileAddress, importType);
};
const updateWebpackConfigurationOfImportedFile = (
  currentFileMetadata,
  importedFileAddress,
  webpackChunkConfiguration
) => {
  const currentwebpackConfiguration =
    currentFileMetadata.importedFilesMapping[importedFileAddress]
      .webpackChunkConfiguration;
  if (currentwebpackConfiguration["default"])
    delete currentwebpackConfiguration["default"];
  currentwebpackConfiguration[webpackChunkConfiguration.webpackChunkName] =
    webpackChunkConfiguration;
};
const isSpecifiersPresent = (node) => node.specifiers.length;

const isMemberNodeAndImportStatement = (memberNode) => {
  return (
    memberNode.type === "MemberExpression" &&
    memberNode.object &&
    memberNode.object.callee &&
    memberNode.object.callee.type === "Import" &&
    memberNode.property &&
    memberNode.property.name === "then"
  );
};

const parseComment = (commentSubParts) => {
  commentSubParts[0] = commentSubParts[0].trim();
  commentSubParts[1] = commentSubParts[1].trim();
  let parsedValue;
  parsedValue = commentSubParts[1].replace(/^(['"])(.*)\1$/, "$2");
  if (parsedValue !== commentSubParts[1])
    // String
    return { key: commentSubParts[0], value: parsedValue };
  parsedValue = commentSubParts[1].replace(/^\/(.*)\/(.*)/, "$1");
  parsedValue = new RegExp(parsedValue);
  return { key: commentSubParts[0], value: parsedValue };
};

const doAssignmentOperations = (
  nodeToGetAddress,
  nodeToGetValues,
  currentFileMetadata
) => {
  if (isRequireOrImportStatement(nodeToGetAddress)) {
    const { type: importType, address: givenSourceAdress } =
      getImportedFileAddress(nodeToGetAddress);
    const fileLocation = currentFileMetadata.fileLocation;
    const { type, fileAddress: importedFileAddress } =
      getResolvedImportedFileDetails(
        getDirectoryFromPath(fileLocation),
        givenSourceAdress,
        importType
      );
    currentFileMetadata.importedFilesMapping[importedFileAddress] =
      getDefaultFileObject(importedFileAddress, type);
    setRequiredVariablesObjects(
      nodeToGetValues,
      currentFileMetadata,
      importedFileAddress
    );
  }
};
module.exports = {
  astParserPlugins,
  getDefaultFileObject,
  doIdentifierOperations,
  setDefaultReferenceCount,
  updateSpecifierAndCurrentFileReferenceCount,
  isSpecifiersPresent,
  setRequiredVariablesObjects,
  getImportedFileAddress,
  isRequireOrImportStatement,
  isMemberNodeAndImportStatement,
  getResolvedImportedFileDetails,
  parseComment,
  updateWebpackConfigurationOfImportedFile,
  doAssignmentOperations,
};
