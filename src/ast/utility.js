const {
  OBJECT_PROPERTY,
  IDENTIFIER,
  DEFAULT,
  FILE,
  OBJECT_EXPRESSION,
  ALL_EXPORTS_IMPORTED,
  CALL_EXPRESSION,
  MEMBER_EXPRESSION,
  AWAIT_EXPRESSION,
  STRING_LITERAL,
  TEMPLATE_LITERAL,
  UNRESOLVED_TYPE,
  NONE,
  NORMAL_EXPORT,
  DEFAULT_OBJECT_EXPORT,
} = require("../utility/constants");
const { isFileExtensionNotValid } = require("../utility/helper");
const {
  pathResolver,
  isPathAbsolute,
  getDirectoryFromPath,
  getPathBaseName,
} = require("../utility/resolver");

/**
 * Used to get the local name from a given property, accepts multiple types of properties
 * @param {Object} property AST node to traverse
 * @returns String which denotes the retrieved local name
 */
const getLocalNameFromProperty = (property) => {
  if (property.type === OBJECT_PROPERTY) return property.value.name;
  else if (property.type === IDENTIFIER) return property.name;
  else return DEFAULT;
};

/**
 * Used to get the imported name from a given property, accepts multiple types of properties
 * @param {Object} property AST node to traverse
 * @returns String which denotes the retrieved import name
 */
const getImportedNameFromProperty = (property) => {
  if (property.type === OBJECT_PROPERTY) return property.key.name;
  else if (property.type === IDENTIFIER) return property.name;
  else return DEFAULT;
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
 * Returns an object which set's the default values corresponding to each file's object
 * @param {String} fileLocation Address of the file for which default object has to be created
 * @param {String} type Denotes whether it is a "FILE" or "UNRESOLVED_TYPE"
 * @returns Object consisting of default information related to that file
 */
const getDefaultFileObject = (fileLocation, type = FILE) => {
  const newFileObject = {
    name: getPathBaseName(fileLocation),
    type,
    fileLocation: fileLocation,
    isEntryFile: false,
    exportedVariables: {
      // If the whole exportVariables object is referred
      importReferenceCount: 0,
      referenceCount: 0,
    },
    staticImportFilesMapping: {},
    webpackChunkConfiguration: {},
    importedFilesMapping: {},
  };
  if (isFileExtensionNotValid(fileLocation)) {
    newFileObject.exportedVariables[DEFAULT] =
      getNewDefaultObject(fileLocation);
  }
  return newFileObject;
};

/**
 * Will generate a new object which will used by other file's to refer the exported variables
 * @param {String} fileLocation Address of the file inside which the object was first generated
 * @param {String} name Local name of the object
 * @returns Object containing information which will used to check whether it has been used or not
 */
const getNewDefaultObject = (
  fileLocation,
  name = DEFAULT,
  isEntryFileObject = false
) => {
  return {
    localName: name,
    firstReferencedAt: fileLocation,
    referenceCount: 0,
    isEntryFileObject,
    individualFileReferencesMapping: {},
  };
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
  importType = FILE
) => {
  if (isPathAbsolute(fileAddress)) return { type: FILE, fileAddress };
  return pathResolver(directoryAddress, fileAddress, importType);
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
  if (nodeToGetValues.type === IDENTIFIER)
    return {
      exportedVariablesArray: [{ [nodeToGetValues.name]: DEFAULT }],
      type: NORMAL_EXPORT,
    };
  // module.exports = {X} type statements
  else if (nodeToGetValues.type === OBJECT_EXPRESSION) {
    const keyValuesPairArray = getValuesFromObject(nodeToGetValues.properties);
    return {
      exportedVariablesArray: keyValuesPairArray,
      type: DEFAULT_OBJECT_EXPORT,
    };
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
    return { exportedVariablesArray: keyValuesPairArray, type: NORMAL_EXPORT };
  } else if (nodeToGetValues.declaration) {
    // export default x type statements
    if (nodeToGetValues.declaration.name)
      return {
        exportedVariablesArray: [
          { [nodeToGetValues.declaration.name]: DEFAULT },
        ],
        type: NORMAL_EXPORT,
      };
    else if (nodeToGetValues.declaration.declarations) {
      // export const x = () => {} type statements
      const keyValuesPairArray = [];
      nodeToGetValues.declaration.declarations.forEach((declaration) => {
        if (declaration.id.name) {
          keyValuesPairArray.push({
            [declaration.id.name]: declaration.id.name,
          });
        }
      });
      return {
        exportedVariablesArray: keyValuesPairArray,
        type: NORMAL_EXPORT,
      };
    } else if (nodeToGetValues.declaration.id) {
      // export function x(){} type statements
      const keyValuesPairArray = [];
      // export default function x(){} type statements
      if (type === DEFAULT) {
        keyValuesPairArray.push({
          [nodeToGetValues.declaration.id.name]: DEFAULT,
        });
      } else
        keyValuesPairArray.push({
          [nodeToGetValues.declaration.id.name]:
            nodeToGetValues.declaration.id.name,
        });
      return {
        exportedVariablesArray: keyValuesPairArray,
        type: NORMAL_EXPORT,
      };
    }
    // export default x  = () => {} type cases
    else if (nodeToGetValues.declaration.left) {
      const keyValuesPairArray = [];
      if (type === DEFAULT) {
        keyValuesPairArray.push({
          [nodeToGetValues.declaration.left.name]: DEFAULT,
        });
      } else
        keyValuesPairArray.push({
          [nodeToGetValues.declaration.left.name]:
            nodeToGetValues.declaration.left.name,
        });
      return {
        exportedVariablesArray: keyValuesPairArray,
        type: NORMAL_EXPORT,
      };
    }
    // export default {...} type cases
    else if (nodeToGetValues.declaration.properties) {
      const keyValuesPairArray = getValuesFromObject(
        nodeToGetValues.declaration.properties
      );
      return {
        exportedVariablesArray: keyValuesPairArray,
        type: DEFAULT_OBJECT_EXPORT,
      };
    }
    // Will cover any other case
    else
      return {
        exportedVariablesArray: [{ [DEFAULT]: DEFAULT }],
        type: NORMAL_EXPORT,
      };
  } else
    return {
      exportedVariablesArray: [{ [DEFAULT]: DEFAULT }],
      type: NORMAL_EXPORT,
    };
};

/**
 * Parses the given array to generate a new key-value pairs array
 * @param {Array} arrayToGetValuesFrom
 * @returns Array containing key-value pairs
 */
const getValuesFromObject = (arrayToGetValuesFrom) => {
  const keyValuesPairArray = [];
  arrayToGetValuesFrom.forEach((property) => {
    // Each individual element inside the {...} is a property
    if (property.key) {
      const keyName = property.key.name
        ? property.key.name
        : property.key.value;
      if (property.value && property.value.name)
        keyValuesPairArray.push({ [property.value.name]: keyName });
      else if (property.value && property.value.id)
        keyValuesPairArray.push({ [property.value.id.name]: keyName });
      else keyValuesPairArray.push({ [keyName]: keyName });
    }
  });
  return keyValuesPairArray;
};
/**
 * Will set the export variables of the current file
 * If an export is also an imported variable, then it will simply refer it
 * @param {Array} exportedVariablesArray Array of parsed exported variables each containing a key value pair
 * @param {Object} currentFileMetadata To check whether a variable was imported or is a local one
 * @param {Object} filesMetadata To get all exported variables of another file
 */
const setExportedVariablesFromArray = (
  { exportedVariablesArray, type },
  currentFileMetadata,
  filesMetadata
) => {
  exportedVariablesArray.forEach((variable) => {
    let exportVariableMetadata;
    try {
      // If it is an imported variable
      if (
        currentFileMetadata.importedVariablesMetadata[Object.keys(variable)[0]]
      ) {
        const importedVariable =
          currentFileMetadata.importedVariablesMetadata[
            Object.keys(variable)[0]
          ];
        exportVariableMetadata = {
          variable,
          importedVariable,
        };
      } else {
        // If it isn't an imported variable
        exportVariableMetadata = {
          variable,
          importedVariable: null,
        };
      }
      if (type === NORMAL_EXPORT) {
        exportVariableMetadata.variableToUpdate =
          currentFileMetadata.exportedVariables;
      } else {
        if (!currentFileMetadata.exportedVariables[DEFAULT]) {
          currentFileMetadata.exportedVariables[DEFAULT] = getNewDefaultObject(
            currentFileMetadata.fileLocation,
            DEFAULT,
            currentFileMetadata.isEntryFile
          );
        }
        exportVariableMetadata.variableToUpdate =
          currentFileMetadata.exportedVariables[DEFAULT];
      }
      setExportVariable(
        exportVariableMetadata,
        currentFileMetadata,
        filesMetadata
      );
    } catch (_) {}
  });
};

/**
 * Will set the current file's exported variable and it's corresponding attributes
 * @param {Object} exportVariableMetadata Contains the local and exported name of the exported variable, information whether the exported variable was first imported
 * @param {Object} currentFileMetadata To check whether a variable was imported or is a local one
 * @param {Object} filesMetadata To get all exported variables of another file
 */
const setExportVariable = (
  { variable, importedVariable, variableToUpdate },
  currentFileMetadata,
  filesMetadata
) => {
  try {
    if (importedVariable) {
      const importedVariableToSet =
        importedVariable.type === ALL_EXPORTS_IMPORTED
          ? filesMetadata.filesMapping[importedVariable.importedFrom]
              .exportedVariables
          : filesMetadata.filesMapping[importedVariable.importedFrom]
              .exportedVariables[importedVariable.name];

      variableToUpdate[Object.values(variable)[0]] = importedVariableToSet;

      variableToUpdate[
        Object.values(variable)[0]
      ].individualFileReferencesMapping[currentFileMetadata.fileLocation] =
        importedVariable.referenceCountObject;

      variableToUpdate[Object.values(variable)[0]].isEntryFileObject |=
        currentFileMetadata.isEntryFile;
    } else {
      variableToUpdate[Object.values(variable)[0]] = getNewDefaultObject(
        currentFileMetadata.fileLocation,
        Object.keys(variable)[0]
      );
    }
  } catch (_) {}
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
  if (node.type === CALL_EXPRESSION) callExpression = node;
  else if (node.type === MEMBER_EXPRESSION) callExpression = node.object;
  else if (node.type === AWAIT_EXPRESSION) callExpression = node.argument;
  return callExpression;
};

/**
 * File's path can be given in both string or template literal format
 * @param {Object} argument Will parse it to get the file's given address
 * @returns Object containing the type and address present inside the argument
 */
const getValueFromStringOrTemplateLiteral = (argument) => {
  if (argument.type === STRING_LITERAL)
    return { type: FILE, address: argument.value };
  else if (argument.type === TEMPLATE_LITERAL && argument.quasis.length)
    return {
      type: UNRESOLVED_TYPE,
      address: getLastFeasibleAddress(argument.quasis[0].value.cooked),
    };
  else return { type: NONE };
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
  importedFileAddress,
  count = 0
) => {
  return {
    name,
    localName,
    type,
    importedFrom: importedFileAddress,
    referenceCountObject: {
      referenceCount: count,
      exportReferenceCount: 0,
    },
  };
};

module.exports = {
  getNewDefaultObject,
  getLocalNameFromProperty,
  getImportedNameFromProperty,
  setExportedVariablesFromArray,
  getDefaultFileObject,
  getResolvedPathFromGivenPath,
  getResolvedImportedFileDetails,
  getValuesFromStatement,
  getImportedFileAddress,
  getNewImportVariableObject,
  getCallExpressionFromNode,
};
