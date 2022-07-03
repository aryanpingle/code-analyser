import _generate from "@babel/generator";
import fs from "fs";

const generate = _generate.default;

/**
 * Used to retrieve all the imported files which were actually referred in the current file
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @returns Object containing information of all imported files which are at least referred once
 */
export const getUsedFilesMapping = (currentFileMetadata) => {
  const usedFilesMapping = {};
  const visitedFilesMapping = {};
  const importedVariablesMapping =
    currentFileMetadata.importedVariablesMetadata;
  Object.values(importedVariablesMapping).forEach((variableObject) => {
    visitedFilesMapping[variableObject.importedFrom] = true;
    if (variableObject.referenceCountObject.referenceCount)
      usedFilesMapping[variableObject.importedFrom] = true;
  });
  Object.keys(currentFileMetadata.importedFilesMapping).forEach((file) => {
    if (!visitedFilesMapping[file]) usedFilesMapping[file] = true;
  });
  return usedFilesMapping;
};

/**
 * Get size (in bytes) of the code after removing whitespaces, comments
 * @param {Object} fileAst AST of the given file (will be used to generate the minified code)
 * @param {String} fileLocation Absolute address of the given file
 * @returns Size (in bytes) of the minified code
 */
export const getFileSize = (fileAst, fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  // Will minify the original code, Eg. will remove unnecessary whitespaces, comments
  const minifiedCode = generate(
    fileAst,
    {
      minified: true,
      comments: false,
    },
    code
  );
  return Buffer.byteLength(minifiedCode.code);
};

/**
 * Update existing filesMetdata with the help of currently parsed file's metadata
 * @param {Object} filesMetadata Metadata of all files parsed by the program
 * @param {Object} currentFileMetadata Metadata of the currently parsed file
 */
export const updateFilesMetadata = (filesMetadata, currentFileMetadata) => {
  const filesMapping = filesMetadata.filesMapping;
  const currentFileMapping = currentFileMetadata.importedFilesMapping;
  filesMapping[currentFileMetadata.fileLocation].exportedVariables =
    currentFileMetadata.exportedVariables;
  filesMapping[currentFileMetadata.fileLocation].importedFilesMapping =
    currentFileMapping;
};
