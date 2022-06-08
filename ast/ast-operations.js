const {
  updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements,
  setImportedVariableInCurrentFileMetadata,
  getResolvedPathFromGivenPath,
  setImportedVariablesFromExportFromStatementSpecifier,
  getImportedFileAddress,
  updateWebpackConfigurationOfImportedFile,
  parseComment,
  getNewWebpackConfigurationObject,
  getResolvedImportedFileDetails,
  getValuesFromStatement,
  setExportedVariablesFromArray,
  getAllPropertiesFromNode,
  setImportedVariablesDuringImportStage,
  setDefaultReferenceCounts,
  getNewImportVariableObject,
} = require("./utility");
const { getDirectoryFromPath } = require("../utility/resolver");
const {
  isSpecifiersPresent,
  isImportStatementArgumentsPresent,
  isModuleExportStatement,
  isRequireStatement,
  isExportFromTypeStatement,
} = require("./conditional-expressions-checks");
const { isGenericType } = require("@babel/traverse/lib/path/inference");

/**
 * Will set all variables present in the statement as the imported variables of the current file
 * @param {Object} importNode Node in AST containing information related to the statement
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @param {String} traversalType Denotes called under which stage of execution
 */
const doImportDeclartionOperations = (
  importNode,
  currentFileMetadata,
  traversalType
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAddress = importNode.source.value;
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress
  );
  // Set this file as imported
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  currentFileMetadata.staticImportFilesMapping[importedFileAddress] = true;

  if (
    isSpecifiersPresent(importNode) &&
    traversalType === "CHECK_IMPORTS"
  ) {
    importNode.specifiers.forEach((specifier) => {
      try {
        setImportedVariableInCurrentFileMetadata(
          specifier,
          currentFileMetadata,
          importedFileAddress
        );
      } catch (_) {}
    });
  }
};

/**
 * Will set imported variables equal to the imported file's respective exports
 * Also will update their reference counts if possible
 * @param {Object} importNode Node in AST containing information related to the statement
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doImportDeclartionOperationsAfterSetup = (
  importNode,
  currentFileMetadata,
  filesMetadata
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAddress = importNode.source.value;
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  currentFileMetadata.staticImportFilesMapping[importedFileAddress] = true;

  try {
    // If some variables are being imported from the import statement
    if (isSpecifiersPresent(importNode)) {
      importNode.specifiers.forEach((specifier) => {
        let type = "ALL_EXPORTS_IMPORTED";
        const localEntityName = specifier.local.name;
        let importedEntityName = localEntityName;
        // If import ... from ... or import {...} from ... type statements
        if (specifier.type === "ImportSpecifier") {
          importedEntityName = specifier.imported.name;
          type = "INDIVIDUAL_IMPORT";
        } else if (specifier.type === "ImportDefaultSpecifier") {
          importedEntityName = "default";
          type = "INDIVIDUAL_IMPORT";
        }
        try {
          // import * as ... from ... type statements
          if (type === "ALL_EXPORTS_IMPORTED") {
            currentFileMetadata.importedVariables[localEntityName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables;
            if (
              !currentFileMetadata.importedVariables[localEntityName]
                .referenceCount
            ) {
              setDefaultReferenceCounts(
                currentFileMetadata.importedVariables[localEntityName]
              );
            }
            // If export of that variable present at current instance
            if (currentFileMetadata.importedVariables[localEntityName]) {
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
      });
    } else {
      // import "..." type statements
      filesMetadata.filesMapping[importedFileAddress].exportedVariables[
        "default"
      ].referenceCount += 1;
    }
  } catch (_) {}
};

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
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAddress = exportNode.source.value;
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress
  );

  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  currentFileMetadata.staticImportFilesMapping[importedFileAddress] = true;

  if (traverseType === "CHECK_IMPORTS" && isSpecifiersPresent(exportNode)) {
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
 * @param {Object} nodeToGetValues AST node containing export from type statement information
 * @param {String} type To check whether it is a default type export or not
 */
const doExportSpecifiersOperations = (
  nodeToGetValues,
  currentFileMetadata,
  filesMetadata,
  type
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
          let specifierType = "ALL_EXPORTS_EXPORTED";
          let exportName = specifier.exported.name;
          let importName = exportName;
          // "export {...} from ..." type statements
          if (specifier.type === "ExportSpecifier") {
            specifierType = "INDIVIDUAL_IMPORT";
            importName = specifier.local.name;
          }
          // "export * as ... from ..." type statements
          else if (specifier.type === "ExportNamespaceSpecifier") {
            specifierType = "ALL_EXPORTS_AS_OBJECT";
          }

          if (
            specifierType === "ALL_EXPORTS_EXPORTED" ||
            specifierType === "ALL_EXPORTS_AS_OBJECT"
          ) {
            currentFileMetadata.exportedVariables[exportName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables;
            if (
              !currentFileMetadata.exportedVariables[exportName].referenceCount
            ) {
              setDefaultReferenceCounts(
                currentFileMetadata.exportedVariables[exportName]
              );
            }
          } else if (specifierType === "INDIVIDUAL_IMPORT") {
            currentFileMetadata.exportedVariables[exportName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables[
                importName
              ];
          }
        } catch (_) {}
      });
    } else {
      // "export * from ..." type statements
      for (const variable in filesMetadata.filesMapping[importedFileAddress]
        .exportedVariables)
        currentFileMetadata.exportedVariables[variable] =
          filesMetadata.filesMapping[importedFileAddress].exportedVariables[
            variable
          ];
    }
  } else {
    const exportedVariablesArray = getValuesFromStatement(
      nodeToGetValues,
      type
    );
    setExportedVariablesFromArray(
      exportedVariablesArray,
      currentFileMetadata,
      filesMetadata
    );
  }
};
/**
 * Helps to update individual exports inside an exported variable which contains multiple children exports (eg. factory code)
 * @param {Object} node AST node to parse
 */
const doAccessingPropertiesOfObjectOperations = (node, currentFileMetadata) => {
  const allPropertiesArray = getAllPropertiesFromNode(node);
  if (allPropertiesArray.length === 0) return;

  const headPropertyWhichIsPresentInsideCurrentFile = allPropertiesArray[0];
  if (
    currentFileMetadata.importedVariables[
      headPropertyWhichIsPresentInsideCurrentFile
    ]
  ) {
    // First exported variable will be by default be present in the current file as an imported variable
    let exportedVariableToUpdate =
      currentFileMetadata.importedVariables[
        headPropertyWhichIsPresentInsideCurrentFile
      ];
    let currentIndex = 1,
      arrayLength = allPropertiesArray.length;

    while (
      currentIndex < arrayLength &&
      exportedVariableToUpdate[allPropertiesArray[currentIndex]]
    ) {
      // Traverse from this variable to another export variable which will be present as an object inside this exported variable
      if (!exportedVariableToUpdate.referenceCount) {
        setDefaultReferenceCounts(exportedVariableToUpdate);
      }
      exportedVariableToUpdate.referenceCount++;
      // Update the exported variable to it's child property object
      exportedVariableToUpdate =
        exportedVariableToUpdate[allPropertiesArray[currentIndex]];
      currentIndex++;
    }
    exportedVariableToUpdate.referenceCount++;
  }
};

/**
 * Set dynamic imports and require statements support, update reference counts depending upon the provided format
 * @param {Object} nodeToGetAddress AST node which will be used to parse file's address
 * @param {Object} nodeToGetValues AST node which will be used to parse file's imported variables
 * @param {String} operationType Stage where this function is called, either CHECK_USAGE or CHECK_IMPORTS or CHECK_STATIC_IMPORTS_ADDRESSES
 */
const doRequireOrImportStatementOperations = (
  nodeToGetAddress,
  nodeToGetValues,
  currentFileMetadata,
  filesMetadata,
  operationType = "CHECK_USAGE"
) => {
  const { type: importType, address: givenSourceAddress } =
    getImportedFileAddress(nodeToGetAddress);
  const fileLocation = currentFileMetadata.fileLocation;
  const { fileAddress: importedFileAddress } = getResolvedImportedFileDetails(
    getDirectoryFromPath(fileLocation),
    givenSourceAddress,
    importType
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  // As dynamic imports will be present in a different chunk
  if (isRequireStatement(nodeToGetAddress)) {
    currentFileMetadata.staticImportFilesMapping[importedFileAddress] = true;
  }
  if (operationType === "CHECK_USAGE") {
    updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements(
      nodeToGetValues,
      currentFileMetadata,
      importedFileAddress,
      filesMetadata
    );
  } else if (operationType === "CHECK_IMPORTS") {
    setImportedVariablesDuringImportStage(
      nodeToGetValues,
      currentFileMetadata,
      importedFileAddress
    );
  }
};
/**
 * Will check if it is a "module.exports = {...}" type statements, and if so will parse and set the file's exported variables
 * @param {Object} nodeToGetValues AST node from which exported variables will be retrieved
 * @param {Object} nodeToCheck AST node which will be checked to verify if it is module exports type statement or not
 * @param {Object} currentFileMetadata Object containing information related to the current file
 * @param {Object} filesMetadata Contains all files' metadata
 */
const doModuleExportStatementOperations = (
  nodeToGetValues,
  nodeToCheck,
  currentFileMetadata,
  filesMetadata
) => {
  // "module.exports = {...}" type statement
  if (isModuleExportStatement(nodeToCheck)) {
    const exportedVariablesArray = getValuesFromStatement(nodeToGetValues);
    setExportedVariablesFromArray(
      exportedVariablesArray,
      currentFileMetadata,
      filesMetadata
    );
  }
};
/**
 * Will be called by import(...).then(...) type statements
 * Will set imported variables during the CHECK_IMPORTS stage
 * @param {Object} path AST path inside which node corresponding to this statement is present
 * @param {Object} currentFileMetadata Will be used to update the imported variables of the current file
 */
const doDynamicImportWithPromiseOperations = (
  path,
  currentFileMetadata,
  traversalType
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const node = callExpressionNode.callee;
  const { type: importType, address: givenSourceAddress } =
    getImportedFileAddress(node.object);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress,
    importType
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  // No need to check for variables if we are checking for intra-module dependencies
  if (traversalType === "CHECK_IMPORTS") {
    try {
      if (isImportStatementArgumentsPresent(callExpressionNode)) {
        callExpressionNode.arguments[0].params.forEach((specifier) => {
          // Specific exports called by this file
          if (specifier.type === "ObjectPattern") {
            specifier.properties.forEach((property) => {
              const localEntityName = property.key.name;
              let importedEntityName = localEntityName;
              let exportType = "INDIVIDUAL_IMPORT";

              currentFileMetadata.importedVariables[localEntityName] =
                getNewImportVariableObject(
                  importedEntityName,
                  localEntityName,
                  exportType,
                  importedFileAddress
                );
            });
          } else if (specifier.type === "Identifier") {
            const localEntityName = specifier.name;
            const exportType = "ALL_EXPORTS_IMPORTED";
            // All exports of another file are required
            currentFileMetadata.importedVariables[localEntityName] =
              getNewImportVariableObject(
                localEntityName,
                localEntityName,
                exportType,
                importedFileAddress
              );
          }
        });
      }
    } catch (_) {}
  }
};

/**
 * Called by import(...).then(...) type statements at CHECK_USAGE stage
 * Will update reference and import reference counts of imported variables
 * @param {Object} path AST path which contains the node corresponding to this statement
 */
const doDynamicImportWithPromiseOperationsAfterSetup = (
  path,
  currentFileMetadata,
  filesMetadata
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const node = callExpressionNode.callee;
  const { type: importType, address: givenSourceAddress } =
    getImportedFileAddress(node.object);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress,
    importType
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (isImportStatementArgumentsPresent(callExpressionNode)) {
    // Will update reference count of each parsed variable, (present inside specifier AST node)
    callExpressionNode.arguments[0].params.forEach((specifier) => {
      try {
        updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements(
          specifier,
          currentFileMetadata,
          importedFileAddress,
          filesMetadata
        );
      } catch (_) {}
    });
  }
};

/**
 * Will be used to parse individual import(...) of each dynamic imports
 * Will parse magic comments present inside it to get the chunk in which it will be present
 * @param {*} path AST path inside which node corresponding to this statement is present
 * @param {*} operationType Will be used to decide in which stage it is being called, will parse magic comments only during CHECK_USAGE stage
 */
const doOperationsOnSubPartOfDynamicImports = (
  path,
  currentFileMetadata,
  filesMetadata,
  operationType
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const { type: importType, address: givenSourceAddress } =
    getImportedFileAddress(callExpressionNode);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress,
    importType
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (operationType === "CHECK_USAGE") {
    // By default each dynamic import will be present in a different chunk
    const webpackConfiguration =
      getNewWebpackConfigurationObject(importedFileAddress);

    // Magic comments Array
    const leadingCommentsArray =
      callExpressionNode.arguments[0].leadingComments;

    if (leadingCommentsArray) {
      leadingCommentsArray.forEach((comment) => {
        const { key, value, valid } = parseComment(comment);
        if (valid) {
          webpackConfiguration[key] = value;
        }
      });
    }
    updateWebpackConfigurationOfImportedFile(
      importedFileAddress,
      webpackConfiguration,
      filesMetadata
    );
  }
};
/**
 * Will be called inside const ... = lazy(()=>import(...)) type statements
 * @param {Object} parentNode AST node using which imported variable will be decided
 * @param {Object} childNode AST node using which address of the imported file will be retrieved
 * @param {String} operationType To get in which stage this function is called
 */
const doDynamicImportsUsingLazyHookOperations = (
  parentNode,
  childNode,
  currentFileMetadata,
  filesMetadata,
  operationType
) => {
  try {
    const fileLocation = currentFileMetadata.fileLocation;
    const callExpressionNode = childNode;
    const { type: importType, address: givenSourceAddress } =
      getImportedFileAddress(callExpressionNode);
    const { importedFileAddress } = getResolvedPathFromGivenPath(
      fileLocation,
      givenSourceAddress,
      importType
    );
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
    let identifier = null;
    // X = lazy(()=>{import(...)}) type statement
    if (parentNode.left) {
      identifier = parentNode.left.name;
    }
    // const X = lazy(()=>{import(...)}) type statement
    else if (
      parentNode.declarations &&
      parentNode.declarations[0] &&
      parentNode.declarations[0].id
    ) {
      identifier = parentNode.declarations[0].id.name;
    }
    if (identifier) {
      if (operationType === "CHECK_USAGE") {
        // As we will get only the default exported variable using this statement
        currentFileMetadata.importedVariables[identifier] =
          filesMetadata.filesMapping[importedFileAddress].exportedVariables[
            "default"
          ];
      } else {
        // CHECK_IMPORTS stage
        currentFileMetadata.importedVariables[identifier] =
          getNewImportVariableObject(
            "default",
            identifier,
            "INDIVIDUAL_IMPORT",
            importedFileAddress
          );
      }
    }
  } catch (_) {}
};
/**
 * Updates the references of the imported variable when used
 * @param {Object} path AST path inside which node containing the imported variable's name will be present
 * @param {Object} currentFileMetadata Contains imported variables of the current file
 */
const doIdentifierOperations = (path, currentFileMetadata) => {
  const identifierName = path.node.name;
  // If the token parsed represents an imported variable
  if (currentFileMetadata.importedVariables[identifierName]) {
    try {
      currentFileMetadata.importedVariables[identifierName].referenceCount++;
    } catch (_) {}
  }
};
module.exports = {
  doIdentifierOperations,
  doRequireOrImportStatementOperations,
  doImportDeclartionOperations,
  doExportDeclarationOperations,
  doDynamicImportWithPromiseOperations,
  doOperationsOnSubPartOfDynamicImports,
  doModuleExportStatementOperations,
  doExportSpecifiersOperations,
  doImportDeclartionOperationsAfterSetup,
  doDynamicImportWithPromiseOperationsAfterSetup,
  doDynamicImportsUsingLazyHookOperations,
  doAccessingPropertiesOfObjectOperations,
};
