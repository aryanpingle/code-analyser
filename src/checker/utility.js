const generate = require("@babel/generator").default;
const fs = require("fs");

/**
 * Used to retrieve all the imported files which were actually referred in the current file
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @returns Object containing information of all imported files which are at least referred once
 */
const getUsedFilesMapping = (currentFileMetadata) => {
  const usedFilesMapping = {};
  const visitedFilesMapping = {};
  const importedVariablesMapping =
    currentFileMetadata.importedVariablesMetadata;
  for (const variable in importedVariablesMapping) {
    visitedFilesMapping[importedVariablesMapping[variable].importedFrom] = true;
    if (
      importedVariablesMapping[variable].referenceCountObject.referenceCount
    ) {
      usedFilesMapping[importedVariablesMapping[variable].importedFrom] = true;
    }
  }
  for (const file in currentFileMetadata.importedFilesMapping) {
    if (!visitedFilesMapping[file]) usedFilesMapping[file] = true;
  }
  return usedFilesMapping;
};

/**
 * Get size (in bytes) of the code after removing whitespaces, comments
 * @param {Object} fileAst AST of the given file (will be used to generate the minified code)
 * @param {String} fileLocation Absolute address of the given file
 * @returns Size (in bytes) of the minified code
 */
const getFileSize = (fileAst, fileLocation) => {
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

module.exports = { getUsedFilesMapping, getFileSize };
