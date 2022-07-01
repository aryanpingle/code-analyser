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
  Object.entries(importedVariablesMapping).forEach(([_, variableObject]) => {
    visitedFilesMapping[variableObject.importedFrom] = true;
    if (variableObject.referenceCountObject.referenceCount) {
      usedFilesMapping[variableObject.importedFrom] = true;
    }
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
  // Will minify the original code, Eg. will remove unnecssary whitespaces, comments
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
