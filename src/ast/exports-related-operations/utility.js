const { getNewImportVariableObject } = require("../utility");
const {
  ALL_EXPORTS_IMPORTED,
  INDIVIDUAL_IMPORT,
  EXPORT_SPECIFIER,
  EXPORT_NAMESPACE_SPECIFIER,
  ALL_EXPORTS_AS_OBJECT,
} = require("../../utility/constants");
/**
 * Will parse the export statement's specifier and set it as an import of the current file
 * @param {Object} specifier Node in AST that corresponds to export from statement's specifier
 * @param {Object} currentFileMetadata Contains information related to the current file's imports and exports
 * @param {Object} filesMetadata Contains inforamtion related to all files
 */
const setImportedVariablesFromExportFromStatementSpecifier = (
  specifier,
  currentFileMetadata,
  importedFileAddress
) => {
  const exportName = specifier.exported.name;
  let importName = exportName;
  let type = ALL_EXPORTS_IMPORTED;
  if (specifier.local) {
    importName = specifier.local.name;
    type = INDIVIDUAL_IMPORT;
  }
  currentFileMetadata.importedVariablesMetadata[importName] =
    getNewImportVariableObject(
      exportName,
      importName,
      type,
      importedFileAddress
    );
};
const extractVariableInformationFromSpecifier = (specifier) => {
  let specifierType = INDIVIDUAL_IMPORT;
  let exportName = specifier.exported.name;
  let importName = exportName;
  // "export {...} from ..." type statements
  if (specifier.type === EXPORT_SPECIFIER) {
    specifierType = INDIVIDUAL_IMPORT;
    importName = specifier.local.name;
  }
  // "export * as ... from ..." type statements
  else if (specifier.type === EXPORT_NAMESPACE_SPECIFIER) {
    specifierType = ALL_EXPORTS_AS_OBJECT;
  }
  return { specifierType, exportName, importName };
};
module.exports = {
  setImportedVariablesFromExportFromStatementSpecifier,
  extractVariableInformationFromSpecifier,
};
