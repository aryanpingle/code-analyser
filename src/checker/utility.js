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

const getFileSize = (fileAst, fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  const minifiedCode = generate(
    fileAst,
    {
      minified: true,
      comments: false,
      compact: true,
      concise: true,
    },
    code
  );
  return Buffer.byteLength(minifiedCode.code);
};
module.exports = { getUsedFilesMapping, getFileSize };
