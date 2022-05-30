const path = require("path");
const { pathResolver, isPathAbsolute } = require("../utility/resolver");
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
  } else {
    node.properties.forEach((property) => {
      const importedEntityName = property.key.name;
      const localEntityName = property.value.name;
      const importReferenceCount =
        importedEntityName === localEntityName ? 2 : 1;
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

const isRequireStatement = (node) => {
  const callExpression = getCallExpressionFromNode(node);
  return (
    callExpression &&
    callExpression.callee &&
    callExpression.callee.name === "require"
  );
};

const getCallExpressionFromNode = (node) => {
  let callExpression;
  if (!node) return callExpression;
  if (node.type === "CallExpression") callExpression = node;
  else if (node.type === "MemberExpression") callExpression = node.object;
  return callExpression;
};

const getImportedFileAddress = (node) => {
  const callExpression = getCallExpressionFromNode(node);
  return callExpression.arguments[0].value;
};

const getResolvedImportedFileDetails = (directoryAddress, fileAddress) => {
  if (isPathAbsolute(fileAddress)) return { type: "FILE", fileAddress };
  return pathResolver(directoryAddress, fileAddress);
};

const isSpecifiersPresent = (node) => node.specifiers.length;

module.exports = {
  astParserPlugins,
  getDefaultFileObject,
  doIdentifierOperations,
  setDefaultReferenceCount,
  updateSpecifierAndCurrentFileReferenceCount,
  isSpecifiersPresent,
  setRequiredVariablesObjects,
  getImportedFileAddress,
  isRequireStatement,
  getResolvedImportedFileDetails,
};
