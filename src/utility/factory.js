import { DEFAULT, FILE } from "./constants.js";
import { isFileExtensionNotValid } from "./helper.js";
import { buildExcludedFilesRegex } from "./regex.js";
import { getPathBaseName } from "./resolver.js";

// Factory which will create all the objects that are used by the program
export default (() => {
  return {
    createNewFilesMetadataObject: (exclude, include) =>
      getFilesMetadataObject(exclude, include),
    createNewDefaultFileObject: (fileLocation, type = FILE) =>
      getDefaultFileObject(fileLocation, type),
    createNewDefaultCurrentFileMetadataObject: (
      fileLocation,
      isEntryFile = false
    ) => getDefaultCurrentFileMetadataObject(fileLocation, isEntryFile),
    createNewDefaultVariableObject: (
      fileLocation,
      name = DEFAULT,
      isEntryFileObject = false
    ) => getNewDefaultVariableObject(fileLocation, name, isEntryFileObject),
    createNewImportMetadataObject: (
      name,
      localName,
      type,
      importedFileAddress,
      count = 0
    ) =>
      getNewImportMetadataObject(
        name,
        localName,
        type,
        importedFileAddress,
        count
      ),
    createNewTrieNode: (baseName, pathTillNode = " ", isFile = false) =>
      getNewTrieNode(baseName, pathTillNode, isFile),
  };
})();

/**
 * Returns the default filesMetadata object
 * @param {RegExp} excludedFilesRegex Regex expression denoting excluded files
 * @returns Object containing all files' metadata
 */
const getFilesMetadataObject = (exclude, include) => {
  return {
    filesMapping: {},
    visitedFilesMapping: {},
    excludedFilesRegex: buildExcludedFilesRegex(exclude, include),
    unparsableVistedFiles: 0,
  };
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
      referenceCount: 0,
    },
    staticImportFilesMapping: {},
    webpackChunkConfiguration: {},
    importedFilesMapping: {},
  };
  if (isFileExtensionNotValid(fileLocation))
    newFileObject.exportedVariables[DEFAULT] =
      getNewDefaultVariableObject(fileLocation);

  return newFileObject;
};

/**
 * Will generate a new object which will used by other file's to refer the exported variables
 * @param {String} fileLocation Address of the file inside which the object was first generated
 * @param {String} name Local name of the object
 * @returns Object containing information which will used to check whether it has been used or not
 */
const getNewDefaultVariableObject = (fileLocation, name, isEntryFileObject) => {
  return {
    localName: name,
    firstReferencedAt: fileLocation,
    referenceCount: 0,
    isEntryFileObject,
    individualFileReferencesMapping: {},
  };
};

/**
 * Returns the default currentFileMetadata object
 * @param {String} fileLocation Address of the file whose metadata has to be returned
 * @returns Object containing current file's default metadata
 */
const getDefaultCurrentFileMetadataObject = (fileLocation, isEntryFile) => {
  const newFileObject = {
    importedVariables: {},
    importedVariablesMetadata: {},
    exportedVariables: {
      referenceCount: 0,
      isEntryFileObject: isEntryFile,
    },
    importedFilesMapping: {},
    staticImportFilesMapping: {},
    fileLocation,
    isEntryFile: isEntryFile,
  };
  if (isFileExtensionNotValid(fileLocation)) {
    // If not a valid extension, then as we won't parse it therefore create a default export object for it
    newFileObject.exportedVariables[DEFAULT] =
      objectFactory.createNewDefaultVariableObject(fileLocation);
  }
  return newFileObject;
};

/**
 * Returns a new import object which will be used during the "CHECK_IMPORTS" stage
 * @param {String} name Import name of the variable
 * @param {String} localName Local name in the current file
 * @param {String} type To tell whether all exports will be imported or a specific import will be taken
 * @param {String} importedFileAddress Absolute address of the imported file
 * @returns Object which contains the above information
 */
const getNewImportMetadataObject = (
  name,
  localName,
  type,
  importedFileAddress,
  count
) => {
  return {
    name,
    localName,
    type,
    isDefaultImport: false,
    importedFrom: importedFileAddress,
    referenceCountObject: {
      referenceCount: count,
      exportReferenceCount: 0,
    },
  };
};

// Returns new trie node with provided properties
const getNewTrieNode = (baseName, pathTillNode, isFile) => {
  return {
    baseName,
    pathTillNode,
    childrens: {},
    isFile,
  };
};
