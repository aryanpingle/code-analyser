const {
  OBJECT_PROPERTY,
  IDENTIFIER,
  DEFAULT,
  FILE,
  CALL_EXPRESSION,
  MEMBER_EXPRESSION,
  AWAIT_EXPRESSION,
  STRING_LITERAL,
  TEMPLATE_LITERAL,
  UNRESOLVED_TYPE,
  NONE,
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
  getDefaultFileObject,
  getResolvedPathFromGivenPath,
  getResolvedImportedFileDetails,
  getImportedFileAddress,
  getNewImportVariableObject,
  getCallExpressionFromNode,
};
