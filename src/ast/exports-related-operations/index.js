const { getResolvedPathFromGivenPath } = require("../utility");
const {
  setImportedVariablesFromExportFromStatementSpecifier,
  extractVariableInformationFromSpecifier,
  getValuesFromStatement,
  setExportedVariablesFromArray,
} = require("./utility");
const {
  isSpecifiersPresent,
  isExportFromTypeStatement,
  isNotTraversingToCheckForImportAddresses,
} = require("../helper");
const { ALL_EXPORTS_AS_OBJECT } = require("../../utility/constants");

/**
 * Will set all variables present in the statement as the exported variables of the current file
 * @param {Object} exportNode Node in AST containing information related to the statement
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @param {String} traverseType Whether imports usage check phase
 */
const doExportDeclarationOperations = (
  exportNode,
  currentFileMetadata,
  traverseType
) => {
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    currentFileMetadata.fileLocation,
    exportNode.source.value
  );

  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  currentFileMetadata.staticImportFilesMapping[importedFileAddress] = true;

  if (
    isNotTraversingToCheckForImportAddresses(traverseType) &&
    isSpecifiersPresent(exportNode)
  ) {
    exportNode.specifiers.forEach((specifier) => {
      try {
        setImportedVariablesFromExportFromStatementSpecifier(
          specifier,
          currentFileMetadata,
          importedFileAddress
        );
      } catch (_) {}
    });
  }
};

/**
 * Set the specifiers if present as the export variables of this file
 * If exported variable is some other file's export variable, then it will simply refer that variable
 * @param {Object} exportSpecifierOperationMetadata Contains information like which AST node corresponds to this statement and type of the export statement
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doExportSpecifiersOperations = (
  { nodeToGetValues, type },
  currentFileMetadata,
  filesMetadata
) => {
  if (isExportFromTypeStatement(nodeToGetValues)) {
    const { importedFileAddress } = getResolvedPathFromGivenPath(
      currentFileMetadata.fileLocation,
      nodeToGetValues.source.value
    );
    // If not "export * from ..." type statement
    if (nodeToGetValues.specifiers) {
      nodeToGetValues.specifiers.forEach((specifier) => {
        try {
          let { specifierType, exportName, importName } =
            extractVariableInformationFromSpecifier(specifier);
          if (specifierType === ALL_EXPORTS_AS_OBJECT) {
            currentFileMetadata.exportedVariables[exportName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables;
          } else {
            currentFileMetadata.exportedVariables[exportName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables[
                importName
              ];
          }
          currentFileMetadata.exportedVariables[exportName].isEntryFileObject |=
            currentFileMetadata.isEntryFile;
        } catch (_) {}
      });
    } else {
      // "export * from ..." type statements
      try {
        for (const variable in filesMetadata.filesMapping[importedFileAddress]
          .exportedVariables) {
          try {
            currentFileMetadata.exportedVariables[variable] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables[
                variable
              ];
            currentFileMetadata.exportedVariables[variable].isEntryFileObject |=
              currentFileMetadata.isEntryFile;
          } catch (_) {}
        }
      } catch (_) {}
    }
  } else {
    const exportedVariablesObject = getValuesFromStatement(
      nodeToGetValues,
      type
    );

    setExportedVariablesFromArray(
      exportedVariablesObject,
      currentFileMetadata,
      filesMetadata
    );
  }
};

/**
 * Will check if it is a "module.exports = {...}" type statements, and if so will parse and set the file's exported variables
 * @param {Object} nodeToGetValues AST node from which exported variables will be retrieved
 * @param {Object} currentFileMetadata Object containing information related to the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doModuleExportStatementOperations = (
  nodeToGetValues,
  currentFileMetadata,
  filesMetadata
) => {
  // "module.exports = {...}" type statement
  const exportedVariablesObject = getValuesFromStatement(nodeToGetValues);
  setExportedVariablesFromArray(
    exportedVariablesObject,
    currentFileMetadata,
    filesMetadata
  );
};

module.exports = {
  doExportDeclarationOperations,
  doExportSpecifiersOperations,
  doModuleExportStatementOperations,
};
