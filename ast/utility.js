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
/**
 * This function parses the specifier and set this specifier as current file's imported variable
 * Will update necessary metadata and import variable mappings
 * @param {Object} specifier Node in AST which contains information related to the variable which will be imported
 * @param {String} importedFileAddress Absolute address of the imported file
 * @param {Object} currentFileMetadata Contains information related to the current file's imports and exports
 * @param {Object} filesMetadata Contains inforamtion related to all files
 */
const setImportedVariableInCurrentFileMetadata = (
  specifier,
  importedFileAddress,
  currentFileMetadata,
  filesMetadata
) => {
  const localEntityName = specifier.local.name;
  let importedEntityName = localEntityName;

  // default case: "import * as ... from ..."
  let type = "ALL_EXPORTS_IMPORTED";
  // If import ... from ... or import {...} from ... type statements
  if (
    specifier.type === "ImportSpecifier" ||
    specifier.type === "ImportDefaultSpecifier"
  ) {
    if (specifier.type === "ImportSpecifier")
      importedEntityName = specifier.imported.name;
    else {
      importedEntityName = "default";
    }
    type = "INDIVIDUAL_IMPORT";
  }
  currentFileMetadata.importedVariablesMetadata[localEntityName] =
    getNewImportVariableObject(
      importedEntityName,
      localEntityName,
      type,
      importedFileAddress
    );

  try {
    // import * as ... from ... type statements
    if (type === "ALL_EXPORTS_IMPORTED") {
      currentFileMetadata.importedVariables[localEntityName] =
        filesMetadata.filesMapping[importedFileAddress].exportedVariables;
      if (
        !currentFileMetadata.importedVariables[localEntityName].referenceCount
      ) {
        setDefaultReferenceCounts(
          currentFileMetadata.importedVariables[localEntityName]
        );
      }
      // If export of that variable present at current instance
      if (currentFileMetadata.importedVariables[localEntityName]) {
        updateImportAnd;
        currentFileMetadata.importedVariables[
          localEntityName
        ].referenceCount += 1;
        currentFileMetadata.importedVariables[
          localEntityName
        ].importReferenceCount += 1;
      }
    }
    // If import ... from ... or import {...} from ... type statements
    else if (type === "INDIVIDUAL_IMPORT") {
      currentFileMetadata.importedVariables[localEntityName] =
        filesMetadata.filesMapping[importedFileAddress].exportedVariables[
          importedEntityName
        ];
      if (currentFileMetadata.importedVariables[localEntityName]) {
        currentFileMetadata.importedVariables[
          localEntityName
        ].referenceCount += 1;
        currentFileMetadata.importedVariables[
          localEntityName
        ].importReferenceCount += 1;
      }
    }
  } catch (_) {}
};

/**
 * Will parse the export statement's specifier and set it as an import of the current file
 * @param {Object} specifier Node in AST that corresponds to export from statement's specifier
 */
const setImportedVariablesFromExportFromStatementSpecifier = (
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
  currentFileMetadata.importedVariablesMetadata[importName] =
    getNewImportVariableObject(
      exportName,
      importName,
      type,
      importedFileAddress
    );
};

/**
 * Returns a new import object which will be used during the "CHECK_IMPORTS" stage
 * @param {String} name Import name of the variable
 * @param {String} localName Local name in the current file
 * @param {String} type To tell whether all exports will be imported or a specific import will be taken
 * @param {String} importedFileAddress Absolute address of the imported file
 * @returns Object which contains the above information
 */
const getNewImportVariableObject = (
  name,
  localName,
  type,
  importedFileAddress
) => {
  return {
    name,
    localName,
    type,
    importedFrom: importedFileAddress,
  };
};

/**
 * Updates imported variables references count (including import reference count)
 * Will be used inside require or dynamic import type statements
 * @param {Object} node AST node from which values will be retrieved
 * @param {String} importedFileAddress Absolute address of the imported file
 */
const updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements =
  (node, currentFileMetadata, importedFileAddress, filesMetadata) => {
    if (!node) {
      // no imported values used (eg. css, html imports)
      const exportedVariable =
        filesMetadata.filesMapping[importedFileAddress].exportedVariables[
          "default"
        ];
      exportedVariable.importReferenceCount += 1;
      exportedVariable.referenceCount += 2;
      // Importing all exports of a file. Eg. const X = require(...);
    } else if (node.type === "Identifier") {
      try {
        const localEntityName = node.name;
        currentFileMetadata.importedVariables[localEntityName] =
          filesMetadata.filesMapping[importedFileAddress].exportedVariables;
        if (
          !currentFileMetadata.importedVariables[localEntityName].referenceCount
        ) {
          setDefaultReferenceCounts(
            currentFileMetadata.importedVariables[localEntityName]
          );
        }
        currentFileMetadata.importedVariables[
          localEntityName
        ].importReferenceCount += 1;
        currentFileMetadata.importedVariables[
          localEntityName
        ].referenceCount += 1;
      } catch (_) {}
    }
    // Selective imports, Eg. const {...} = require(...)
    else if (node.type === "ObjectPattern" || node.type === "ArrayPattern") {
      const patternToCheck =
        node.type === "ObjectPattern" ? node.properties : node.elements;
      patternToCheck.forEach((property) => {
        const importedEntityName = getImportedNameFromProperty(property);
        const localEntityName = getLocalNameFromProperty(property);
        // An identifier will be referenced twice if local and import names are same
        const importReferenceCount =
          importedEntityName === localEntityName &&
          node.type === "ObjectPattern"
            ? 2
            : 1;
        try {
          // Individual import
          currentFileMetadata.importedVariables[localEntityName] =
            filesMetadata.filesMapping[importedFileAddress].exportedVariables[
              importedEntityName
            ];
          // Update both references as it is an import type reference
          currentFileMetadata.importedVariables[
            localEntityName
          ].importReferenceCount += importReferenceCount;
          currentFileMetadata.importedVariables[
            localEntityName
          ].referenceCount += importReferenceCount;
        } catch (_) {}
      });
    }
  };

/**
 * Set require and dynamic import's imported variables which were parsed from the given node
 * @param {Object} node AST node which will be parsed
 * @param {String} importedFileAddress Absolute address of the imported file
 */
const setImportedVariablesDuringImportStage = (
  node,
  currentFileMetadata,
  importedFileAddress
) => {
  if (!node) return;
  if (node.type === "Identifier") {
    const localName = node.name;
    currentFileMetadata.importedVariablesMetadata[localName] =
      getNewImportVariableObject(
        null,
        localName,
        "ALL_EXPORTS_IMPORTED",
        importedFileAddress
      );
  } else if (node.type === "ObjectPattern") {
    node.properties.forEach((property) => {
      const localName = property.value.name;
      const importedName = property.key.name;
      currentFileMetadata.importedVariablesMetadata[localName] =
        getNewImportVariableObject(
          importedName,
          localName,
          "INDIVIDUAL_IMPORT",
          importedFileAddress
        );
    });
  }
};

/**
 * Used to get the local name from a given property, accepts multiple types of properties
 * @param {Object} property AST node to traverse
 * @returns String which denotes the retrieved local name
 */
const getLocalNameFromProperty = (property) => {
  if (property.type === "ObjectProperty") return property.value.name;
  else if (property.type === "Identifier") return property.name;
  else return "default";
};

/**
 * Used to get the imported name from a given property, accepts multiple types of properties
 * @param {Object} property AST node to traverse
 * @returns String which denotes the retrieved import name
 */
const getImportedNameFromProperty = (property) => {
  if (property.type === "ObjectProperty") return property.key.name;
  else if (property.type === "Identifier") return property.name;
  else return "default";
};

/**
 * Will parse the given node to get the child call expression node which will contain the import address
 * @param {Object} node AST node which will be parsed
 * @returns Object containing the type (FILE or UNRESOLVED TYPE), and the addresss
 */
const getImportedFileAddress = (node) => {
  const callExpression = getCallExpressionFromNode(node);
  return getValueFromStringOrTemplateLiteral(callExpression.arguments[0]);
};

/**
 * Will retrieve the callExpression present inside this node
 * @param {Object} node AST node which will be parsed
 * @returns AST CallExpression node inside which the import address is present
 */
const getCallExpressionFromNode = (node) => {
  let callExpression;
  if (!node) return callExpression;
  if (node.type === "CallExpression") callExpression = node;
  else if (node.type === "MemberExpression") callExpression = node.object;
  else if (node.type === "AwaitExpression") callExpression = node.argument;
  return callExpression;
};

/**
 * File's path can be given in both string or template literal format
 * @param {Object} argument Will parse it to get the file's given address
 * @returns Object containing the type and address present inside the argument
 */
const getValueFromStringOrTemplateLiteral = (argument) => {
  if (argument.type === "StringLiteral")
    return { type: "FILE", address: argument.value };
  else if (argument.type === "TemplateLiteral" && argument.quasis.length)
    return {
      type: "UNRESOLVED TYPE",
      address: getLastFeasibleAddress(argument.quasis[0].value.cooked),
    };
  else return { type: "NONE" };
};

/**
 * Will be called if parsing a path given as a template literal
 * @param {String} givenPath Path which has to be parsed
 * @returns String denoting the largest static part of the given path
 */
const getLastFeasibleAddress = (givenPath) => {
  // If relative path given, then will return the address which is completely static
  // Eg. parsing `/abc/${X}` will return /abc, as the last part of the given path is dynamic
  return givenPath.replace(/(.{2,})\/(.*)$/, "$1");
};

/**
 * Will be called to get the absolute source addresss from the given source address
 * @param {String} currentFileLocation Address of the currently parsed file
 * @param {String} givenSourceAdress Provided address (relative, absolute, node_modules)
 * @param {String} importType Either address given as a string or template literal
 * @returns Object containing type (FILE or UNRESOLVED TYPE), and absolute address of the given source
 */
const getResolvedPathFromGivenPath = (
  currentFileLocation,
  givenSourceAdress,
  importType
) => {
  const { type, fileAddress: importedFileAddress } =
    getResolvedImportedFileDetails(
      getDirectoryFromPath(currentFileLocation),
      givenSourceAdress,
      importType
    );
  return { type, importedFileAddress };
};

/**
 * Will return the absolute address of provided file's address
 * @param {String} directoryAddress Used if address given in relative format
 * @param {String} fileAddress Given source address
 * @param {String} importType Either address given as a string or template literal
 * @returns Absolute path of this source
 */
const getResolvedImportedFileDetails = (
  directoryAddress,
  fileAddress,
  importType = "FILE"
) => {
  if (isPathAbsolute(fileAddress)) return { type: "FILE", fileAddress };
  return pathResolver(directoryAddress, fileAddress, importType);
};

// Chunk's name set as the file's address, to simulate it is present in a different chunk
const getNewWebpackConfigurationObject = (fileLocation) => {
  return {
    webpackChunkName: fileLocation,
  };
};

/**
 * Will parse the provided comment to get it's two sub parts representing key value pair of a magic comment
 * @param {String} comment String which has to be parsed
 * @returns Object containing information whether this comment may be a magic comment or not
 */
const parseComment = (comment) => {
  const commentSubParts = comment.value.split(":");
  if (commentSubParts.length === 2) {
    commentSubParts[0] = commentSubParts[0].trim();
    commentSubParts[1] = commentSubParts[1].trim();
    let parsedValue;
    // If the value given as a string
    parsedValue = commentSubParts[1].replace(/^(['"])(.*)\1$/, "$2");
    if (parsedValue !== commentSubParts[1])
      return { key: commentSubParts[0], value: parsedValue, valid: true };
    // If the value given as a regex
    parsedValue = commentSubParts[1].replace(/^\/(.*)\/(.*)/, "$1");
    parsedValue = new RegExp(parsedValue);
    return { key: commentSubParts[0], value: parsedValue, valid: true };
  }
  // Invalid format
  return { valid: false };
};

/**
 * Will update the webpack chunks in which the provided file is present
 * @param {String} givenFileAddress Provided file address whose webpack configuration has to be updated
 * @param {Object} webpackChunkConfiguration Object containing information related to the webpack chunk in which this file is present
 * @param {Object} filesMetadata Contains information related to all files
 */
const updateWebpackConfigurationOfImportedFile = (
  givenFileAddress,
  webpackChunkConfiguration,
  filesMetadata
) => {
  try {
    const currentwebpackConfiguration =
      filesMetadata.filesMapping[givenFileAddress].webpackChunkConfiguration;
    // This file is now present inside the provided webpack chunk too
    currentwebpackConfiguration[webpackChunkConfiguration.webpackChunkName] =
      webpackChunkConfiguration;
  } catch (_) {}
};

/**
 * Covers various types of export statements
 * Covers both commonJs and ES6 type exports
 * @param {Object} nodeToGetValues AST node to get values from
 * @param {String} type To check whether it is a default export or not
 * @returns Array of key value pairs representing local and exported name
 */
const getValuesFromStatement = (nodeToGetValues, type) => {
  // module.exports = X type statements
  if (nodeToGetValues.type === "Identifier")
    return [{ [nodeToGetValues.name]: "default" }];
  // module.exports = {X} type statements
  else if (nodeToGetValues.type === "ObjectExpression") {
    const keyValuesPairArray = [];
    nodeToGetValues.properties.forEach((property) => {
      // Each individual element inside the {...} is a property
      if (property.value && property.key) {
        if (property.value.name)
          keyValuesPairArray.push({ [property.key.name]: property.value.name });
        else
          keyValuesPairArray.push({ [property.key.name]: property.key.name });
      }
    });
    return keyValuesPairArray;
  }
  // export {x as y} type statements
  else if (nodeToGetValues.specifiers && nodeToGetValues.specifiers.length) {
    const keyValuesPairArray = [];
    nodeToGetValues.specifiers.forEach((specifier) => {
      if (specifier.local)
        keyValuesPairArray.push({
          [specifier.local.name]: specifier.exported.name,
        });
      else
        keyValuesPairArray.push({
          [specifier.exported.name]: specifier.exported.name,
        });
    });
    return keyValuesPairArray;
  } else if (nodeToGetValues.declaration) {
    // export default x type statements
    if (nodeToGetValues.declaration.name)
      return [{ [nodeToGetValues.declaration.name]: "default" }];
    else if (nodeToGetValues.declaration.declarations) {
      // export const x = () => {} type statements
      const keyValuesPairArray = [];
      nodeToGetValues.declaration.declarations.forEach((declaration) => {
        keyValuesPairArray.push({ [declaration.id.name]: declaration.id.name });
      });
      return keyValuesPairArray;
    } else if (nodeToGetValues.declaration.id) {
      // export function x(){} type statements
      const keyValuesPairArray = [];
      // export default function x(){} type statements
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
    }
    // Will cover any other case
    else return [{ default: "default" }];
  } else return [];
};

/**
 * Will set the export variables of the current file
 * If an export is also an imported variable, then it will simply refer it
 * @param {Array} exportedVariablesArray Array of parsed exported variables each containing a key value pair
 * @param {Object} currentFileMetadata To check whether a variable was imported or is a local one
 * @param {Object} filesMetadata To get all exported variables of another file
 */
const setExportedVariablesFromArray = (
  exportedVariablesArray,
  currentFileMetadata,
  filesMetadata
) => {
  exportedVariablesArray.forEach((variable) => {
    try {
      // If it is an imported variable
      if (
        currentFileMetadata.importedVariablesMetadata[Object.keys(variable)[0]]
      ) {
        const importedVariable =
          currentFileMetadata.importedVariablesMetadata[
            Object.keys(variable)[0]
          ];
        // If the imported variable is importing all exports of another file inside it
        if (importedVariable.type === "ALL_EXPORTS_IMPORTED") {
          currentFileMetadata.exportedVariables[Object.values(variable)[0]] =
            filesMetadata.filesMapping[
              importedVariable.importedFrom
            ].exportedVariables;
          if (
            !currentFileMetadata.exportedVariables[Object.values(variable)[0]]
              .referenceCount
          ) {
            setDefaultReferenceCounts(
              currentFileMetadata.exportedVariables[Object.values(variable)[0]]
            );
          }
        } else {
          // Individual import scenario
          currentFileMetadata.exportedVariables[Object.values(variable)[0]] =
            filesMetadata.filesMapping[
              importedVariable.importedFrom
            ].exportedVariables[importedVariable.name];
        }
      } else {
        // If it isn't an imported variable
        currentFileMetadata.exportedVariables[Object.values(variable)[0]] =
          getNewDefaultObject(
            currentFileMetadata.fileLocation,
            Object.values(variable)[0]
          );
      }
    } catch (_) {}
  });
};
/**
 * If referenceCount and importReferenceCount variables are not present inside the given object
 * Then it will add them and give default value
 * @param {Object} variableObject Variable which has to be checked
 */
const setDefaultReferenceCounts = (variableObject) => {
  variableObject.referenceCount = 0;
  variableObject.importReferenceCount = 0;
};

/**
 * Will generate a new object which will used by other file's to refer the exported variables
 * @param {String} fileLocation Address of the file inside which the object was first generated
 * @param {String} name Local name of the object
 * @returns Object containing information which will used to check whether it has been used or not
 */
const getNewDefaultObject = (fileLocation, name = "default") => {
  return {
    localName: name,
    firstReferencedAt: fileLocation,
    referenceCount: 0,
    importReferenceCount: 0,
  };
};

/**
 * Returns all individual properties present in a x.y.z or x["y"]["z"] type statements
 * Eg. for the above case, will return [x, y, z]
 * @param {Object} node AST node where this statement was encountered
 * @returns Array containing the parsed properties
 */
const getAllPropertiesFromNode = (node) => {
  const allPropertiesArray = [];
  let headNode = node;
  let typeToCheck, childPropertyToCheck, nodePropertyToCheck;
  if (headNode.type === "TSQualifiedName") {
    typeToCheck = "TSQualifiedName";
    childPropertyToCheck = "left";
    nodePropertyToCheck = "right";
  } else {
    typeToCheck = "MemberExpression";
    childPropertyToCheck = "object";
    nodePropertyToCheck = "property";
  }
  // while there still exists more than one property
  while (headNode && headNode.type === typeToCheck) {
    allPropertiesArray.unshift(headNode[nodePropertyToCheck].name);
    headNode = headNode[childPropertyToCheck];
  }
  // The last property accessed
  allPropertiesArray.unshift(headNode.name);

  return allPropertiesArray;
};

module.exports = {
  astParserPlugins,
  getNewDefaultObject,
  setImportedVariableInCurrentFileMetadata,
  setImportedVariablesFromExportFromStatementSpecifier,
  updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements,
  getImportedFileAddress,
  getResolvedImportedFileDetails,
  parseComment,
  updateWebpackConfigurationOfImportedFile,
  getResolvedPathFromGivenPath,
  getNewWebpackConfigurationObject,
  getCallExpressionFromNode,
  getValuesFromStatement,
  getAllPropertiesFromNode,
  setExportedVariablesFromArray,
  setImportedVariablesDuringImportStage,
  setDefaultReferenceCounts,
  getNewImportVariableObject,
};
