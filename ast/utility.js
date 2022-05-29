const path = require("path");

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

const getDefaultFileObject = (fileLocation) => {
  return {
    name: path.basename(fileLocation),
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

const isSpecifiersPresent = (node) => node.specifiers.length;

module.exports = {
  astParserPlugins,
  getDefaultFileObject,
  doIdentifierOperations,
  setDefaultReferenceCount,
  updateSpecifierAndCurrentFileReferenceCount,
  isSpecifiersPresent
};
