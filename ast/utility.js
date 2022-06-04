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
    isEntryFile: false,
    exportedVariables: {
      default: getNewDefaultObject(fileLocation),
      importReferenceCount: 0,
      referenceCount: 0,
      exportReferenceCount: 0, // If the whole object is referred
    },
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

const setDefaultReferenceCount = (currentFileMetadata, importedFileAddress) => {
  // currentFileMetadata.importedVariables[]
};

const updateImportSpecifierAndCurrentFileReferenceCount = (
  specifier,
  currentFileMetadata,
  importedFileAddress
) => {
  const localEntityName = specifier.local.name;
  let importedEntityName;
  let type = "ALL_EXPORTS_IMPORTED";
  if (specifier.type === "ImportSpecifier") {
    importedEntityName = specifier.imported.name;
    type = "INDIVIDUAL_IMPORT";
  }
  currentFileMetadata.importedVariables[localEntityName] = {
    name: importedEntityName,
    localName: localEntityName,
    type,
    importedFrom: importedFileAddress,
  };
};

const updateExportSpecifierAndCurrentFileReferenceCount = (
  specifier,
  currentFileMetadata,
  importedFileAddress
) => {
  const exportName = specifier.exported.name;
  let importName = exportName;
  let type = "ALL_EXPORTS_IMPORTED";
  if (specifier.local) {
    importName = specifier.local.name;
    type = "INDIVIDUAL_IMPORT";
  }
  currentFileMetadata.importedVariables[importName] = {
    name: exportName,
    localName: importName,
    type,
    importedFrom: importedFileAddress,
  };
};

const setRequiredVariablesObjects = (
  node,
  currentFileMetadata,
  importedFileAddress,
  filesMetadata,
  type = "ImportStatement"
) => {
  if (!node) {
    const exportedVariable =
      filesMetadata.filesMapping[importedFileAddress].exportedVariables[
        "default"
      ];
    exportedVariable.importReferenceCount += 1;
    exportedVariable.referenceCount += 2;
  } else if (node.type === "Identifier") {
    const localEntityName = node.name;
    if (type === "RequireStatement") {
      currentFileMetadata.importedVariables[localEntityName] =
        filesMetadata.filesMapping[importedFileAddress].exportedVariables;
      if (
        !currentFileMetadata.importedVariables[localEntityName].referenceCount
      ) {
        currentFileMetadata.importedVariables[
          localEntityName
        ].referenceCount = 0;
        currentFileMetadata.importedVariables[
          localEntityName
        ].importReferenceCount = 0;
        currentFileMetadata.importedVariables[
          localEntityName
        ].exportReferenceCount = 0;
      }
      // console.log(
      //   filesMetadata.filesMapping[importedFileAddress],
      //   localEntityName
      // );
    } else {
      currentFileMetadata.importedVariables[localEntityName] =
        filesMetadata.filesMapping[importedFileAddress].exportedVariables[
          "default"
        ];
    }
    // console.log(
    //   localEntityName,
    //   importedFileAddress,
    //   filesMetadata.filesMapping[importedFileAddress]
    // );
    currentFileMetadata.importedVariables[
      localEntityName
    ].importReferenceCount += 1;
    currentFileMetadata.importedVariables[localEntityName].referenceCount += 1;
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
      // console.log(filesMetadata.filesMapping[importedFileAddress], importedEntityName)
      try {
        currentFileMetadata.importedVariables[localEntityName] =
          filesMetadata.filesMapping[importedFileAddress].exportedVariables[
            importedEntityName
          ];
        currentFileMetadata.importedVariables[
          localEntityName
        ].importReferenceCount += importReferenceCount;
        currentFileMetadata.importedVariables[localEntityName].referenceCount +=
          importReferenceCount;
      } catch (_) {}
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
  webpackChunkConfiguration,
  filesMetadata
) => {
  const currentwebpackConfiguration =
    filesMetadata.filesMapping[importedFileAddress].webpackChunkConfiguration;
  if (currentwebpackConfiguration["default"])
    delete currentwebpackConfiguration["default"];
  currentwebpackConfiguration[webpackChunkConfiguration.webpackChunkName] =
    webpackChunkConfiguration;
};

const parseComment = (comment) => {
  const commentSubParts = comment.value.split(":");
  if (commentSubParts.length === 2) {
    commentSubParts[0] = commentSubParts[0].trim();
    commentSubParts[1] = commentSubParts[1].trim();
    let parsedValue;
    parsedValue = commentSubParts[1].replace(/^(['"])(.*)\1$/, "$2");
    if (parsedValue !== commentSubParts[1])
      return { key: commentSubParts[0], value: parsedValue, valid: true };
    parsedValue = commentSubParts[1].replace(/^\/(.*)\/(.*)/, "$1");
    parsedValue = new RegExp(parsedValue);
    return { key: commentSubParts[0], value: parsedValue, valid: true };
  }
  return { valid: false };
};

const getNewWebpackConfigurationObject = (fileLocation) => {
  return {
    webpackChunkName: fileLocation,
    webpackPath: fileLocation,
    webpackInclude: /^()/,
    webpackExclude: /!^()/,
  };
};
const getResolvedPathFromGivenPath = (
  fileLocation,
  givenSourceAdress,
  importType = ""
) => {
  const { type, fileAddress: importedFileAddress } =
    getResolvedImportedFileDetails(
      getDirectoryFromPath(fileLocation),
      givenSourceAdress,
      importType
    );
  return { type, importedFileAddress };
};

const getValuesFromStatement = (nodeToGetValues, type) => {
  if (nodeToGetValues.type === "Identifier")
    return [{ [nodeToGetValues.name]: "default" }];
  else if (nodeToGetValues.type === "ObjectExpression") {
    const keyValuesPairArray = [];
    nodeToGetValues.properties.forEach((property) => {
      if (property.value && property.key)
        keyValuesPairArray.push({ [property.value.name]: property.key.name });
    });
    return keyValuesPairArray;
  } else if (nodeToGetValues.specifiers && nodeToGetValues.specifiers.length) {
    const keyValuesPairArray = [];
    nodeToGetValues.specifiers.forEach((specifier) => {
      if (specifier.local)
        keyValuesPairArray.push({
          [specifier.exported.name]: specifier.local.name,
        });
      else
        keyValuesPairArray.push({
          [specifier.exported.name]: specifier.exported.name,
        });
    });
    return keyValuesPairArray;
  } else if (nodeToGetValues.declaration) {
    if (nodeToGetValues.declaration.name)
      return [{ [nodeToGetValues.declaration.name]: "default" }];
    else if (nodeToGetValues.declaration.declarations) {
      // export const x = () => {} type
      const keyValuesPairArray = [];
      nodeToGetValues.declaration.declarations.forEach((declaration) => {
        keyValuesPairArray.push({ [declaration.id.name]: declaration.id.name });
      });
      return keyValuesPairArray;
    } else if (nodeToGetValues.declaration.id) {
      // export function x(){}
      const keyValuesPairArray = [];
      if (type === "default") {
        keyValuesPairArray.push({
          [nodeToGetValues.declaration.id.name]: "default",
        });
      } else
        keyValuesPairArray.push({
          [nodeToGetValues.declaration.id.name]:
            nodeToGetValues.declaration.id.name,
        });
      return keyValuesPairArray;
    } else return [{ default: "default" }];
  } else return [];
};
const getNewDefaultObject = (fileLocation, name = "default") => {
  return {
    localName: name,
    firstReferencedAt: fileLocation,
    referenceCount: 0,
    importReferenceCount: 0,
    exportReferenceCount: 0,
  };
};
const setExportedVariablesFromArray = (
  exportedVariablesArray,
  currentFileMetadata,
  filesMetadata
) => {
  exportedVariablesArray.forEach((variable) => {
    try {
      if (currentFileMetadata.importedVariables[Object.keys(variable)[0]]) {
        const importedVariable =
          currentFileMetadata.importedVariables[Object.keys(variable)[0]];
        if (importedVariable.type === "ALL_EXPORTS_IMPORTED") {
          currentFileMetadata.exportedVariables[Object.values(variable)[0]] =
            filesMetadata.filesMapping[
              importedVariable.importedFrom
            ].exportedVariables;
        } else {
          currentFileMetadata.exportedVariables[Object.values(variable)[0]] =
            filesMetadata.filesMapping[
              importedVariable.importedFrom
            ].exportedVariables[Object.keys(variable)[0]];
        }
      } else {
        currentFileMetadata.exportedVariables[Object.values(variable)[0]] =
          getNewDefaultObject(
            currentFileMetadata.fileLocation,
            Object.values(variable)[0]
          );
      }
    } catch (_) {}
  });
};

module.exports = {
  astParserPlugins,
  getDefaultFileObject,
  setDefaultReferenceCount,
  updateImportSpecifierAndCurrentFileReferenceCount,
  updateExportSpecifierAndCurrentFileReferenceCount,
  setRequiredVariablesObjects,
  getImportedFileAddress,
  getResolvedImportedFileDetails,
  parseComment,
  updateWebpackConfigurationOfImportedFile,
  getResolvedPathFromGivenPath,
  getNewWebpackConfigurationObject,
  getCallExpressionFromNode,
  getValuesFromStatement,
  setExportedVariablesFromArray,
};
