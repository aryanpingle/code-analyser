const {
  updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements,
  setImportedVariableInCurrentFileMetadata,
  getResolvedPathFromGivenPath,
  setImportedVariablesFromExportFromStatementSpecifier,
  getImportedFileAddress,
  updateWebpackConfigurationOfImportedFile,
  parseComment,
  getResolvedImportedFileDetails,
  getValuesFromStatement,
  setExportedVariablesFromArray,
  getAllPropertiesFromNode,
  setImportedVariablesDuringImportStage,
  getNewImportVariableObject,
} = require("./utility");
const { getDirectoryFromPath } = require("../utility/resolver");
const {
  isSpecifiersPresent,
  isImportStatementArgumentsPresent,
  isRequireStatement,
  isExportFromTypeStatement,
  isNotExportTypeReference,
} = require("./conditional-expressions-checks");

/**
 * Will set that the current file has been statically imported
 * @param {Object} importNode Node in AST containing information related to the statement
 * @param {Object} currentFileMetadata Contains information related to the current file
 */
const doImportDeclartionOperations = (importNode, currentFileMetadata) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAddress = importNode.source.value;
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress
  );
  // Set this file as imported
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  currentFileMetadata.staticImportFilesMapping[importedFileAddress] = true;
};

/**
 * Will set imported variables equal to the imported file's respective exports
 * Also will update their reference counts if possible
 * @param {Object} importDecalarationOperationMetadata Contains informations like which node in AST corresponds to this statement, stage at which this function is called, and should references be added/ subtracted
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doImportDeclartionOperationsAfterSetup = (
  { importNode, traverseType, addReferences },
  currentFileMetadata,
  filesMetadata
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAddress = importNode.source.value;
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAddress
  );
  try {
    // If some variables are being imported from the import statement
    if (isSpecifiersPresent(importNode)) {
      importNode.specifiers.forEach((specifier) => {
        const specifierMetadata = {
          specifier,
          traverseType,
          importedFileAddress,
        };
        setImportedVariableInCurrentFileMetadata(
          specifierMetadata,
          currentFileMetadata,
          filesMetadata
        );
      });
    } else {
      // import "..." type statements
      const valueToAdd = addReferences ? 1 : -1;
      filesMetadata.filesMapping[importedFileAddress].exportedVariables[
        "default"
      ].referenceCount += valueToAdd;
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

  if (
    traverseType !== "CHECK_IMPORTS_ADDRESSES" &&
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
          let specifierType = "INDIVIDUAL_IMPORT";
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

          if (specifierType === "ALL_EXPORTS_AS_OBJECT") {
            currentFileMetadata.exportedVariables[exportName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables;
          } else {
            currentFileMetadata.exportedVariables[exportName] =
              filesMetadata.filesMapping[importedFileAddress].exportedVariables[
                importName
              ];
          }
          currentFileMetadata.exportedVariables[
            exportName
          ].isEntryFileObject ||= currentFileMetadata.isEntryFile;
        } catch (_) {}
      });
    } else {
      // "export * from ..." type statements
      for (const variable in filesMetadata.filesMapping[importedFileAddress]
        .exportedVariables) {
        currentFileMetadata.exportedVariables[variable] =
          filesMetadata.filesMapping[importedFileAddress].exportedVariables[
            variable
          ];
        try {
          currentFileMetadata.exportedVariables[variable].isEntryFileObject ||=
            currentFileMetadata.isEntryFile;
        } catch (_) {}
      }
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
 * @param {Object} currentFileMetadata Contains information related to the current file
 * @param {Boolean} addReferences To decide whether references have to be added or subtracted
 */
const doAccessingPropertiesOfObjectOperations = (
  node,
  currentFileMetadata,
  addReferences
) => {
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
    const valueToAdd = addReferences ? 1 : -1;
    currentFileMetadata.importedVariablesMetadata[
      headPropertyWhichIsPresentInsideCurrentFile
    ].referenceCountObject.referenceCount += valueToAdd;

    let currentIndex = 1,
      arrayLength = allPropertiesArray.length;

    while (
      currentIndex < arrayLength &&
      exportedVariableToUpdate[allPropertiesArray[currentIndex]]
    ) {
      // Traverse from this variable to another export variable which will be present as an object inside this exported variable
      exportedVariableToUpdate.referenceCount += valueToAdd;
      // Update the exported variable to it's child property object
      exportedVariableToUpdate =
        exportedVariableToUpdate[allPropertiesArray[currentIndex]];
      currentIndex++;
    }
    exportedVariableToUpdate.referenceCount += valueToAdd;
  }
};

/**
 * Set dynamic imports and require statements support, update reference counts depending upon the provided format
 * @param {Object} requireOrImportStatementMetadata Contains information like AST nodes containing imported file's address and imported variables, whether references should be added, and the stage at which this function is called
 * @param {Object} currentFileMetadata Contains information related to current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doRequireOrImportStatementOperations = (
  { nodeToGetAddress, nodeToGetValues, addReferences, operationType },
  currentFileMetadata,
  filesMetadata
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
  if (operationType !== "CHECK_IMPORTS_ADDRESSES") {
    setImportedVariablesDuringImportStage(
      nodeToGetValues,
      currentFileMetadata,
      importedFileAddress
    );
    if (operationType === "CHECK_USAGE") {
      const updateVariablesMetadata = {
        node: nodeToGetValues,
        addReferences,
        importedFileAddress,
        type: "UPDATE_REFERENCE_COUNT",
      };
      updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements(
        updateVariablesMetadata,
        currentFileMetadata,
        filesMetadata
      );
    }
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
  const exportedVariablesArray = getValuesFromStatement(nodeToGetValues);
  setExportedVariablesFromArray(
    exportedVariablesArray,
    currentFileMetadata,
    filesMetadata
  );
};

/**
 * Will be called by import(...).then(...) type statements
 * Will set imported variables during the CHECK_IMPORTS stage
 * @param {Object} dynamicImportsWithPromiseMetadata Contains information related to corresponding AST node, stage at which this function is called, and whether references have to be added
 * @param {Object} currentFileMetadata Will be used to update the imported variables of the current file
 */
const doDynamicImportWithPromiseOperations = (
  { path, type, addReferences },
  currentFileMetadata
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
  if (type !== "CHECK_IMPORTS_ADDRESSES") {
    const valueToMultiplyWith = addReferences ? 1 : -1;
    // No need to check for variables if we are checking for intra-module dependencies
    try {
      if (isImportStatementArgumentsPresent(callExpressionNode)) {
        callExpressionNode.arguments[0].params.forEach((specifier) => {
          // Specific exports called by this file
          if (specifier.type === "ObjectPattern") {
            specifier.properties.forEach((property) => {
              const localEntityName = property.value.name;
              let importedEntityName = property.key.name;
              let exportType = "INDIVIDUAL_IMPORT";
              const importReferenceCount =
                localEntityName === importedEntityName ? 2 : 1;
              currentFileMetadata.importedVariablesMetadata[localEntityName] =
                getNewImportVariableObject(
                  importedEntityName,
                  localEntityName,
                  exportType,
                  importedFileAddress,
                  // Giving a negative value because the variable will be referred for the same statement afterwards and at that time references will be added/subtracted accordingly
                  -importReferenceCount * valueToMultiplyWith
                );
            });
          } else if (specifier.type === "Identifier") {
            const localEntityName = specifier.name;
            const exportType = "ALL_EXPORTS_IMPORTED";
            // All exports of another file are required
            currentFileMetadata.importedVariablesMetadata[localEntityName] =
              getNewImportVariableObject(
                localEntityName,
                localEntityName,
                exportType,
                importedFileAddress,
                -1 * valueToMultiplyWith
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
 * @param {Object} dynamicImportsWithPromiseMetadata Contains information related to corresponding AST path and whether references have to be added/ subtracted
 * @param {Object} currentFileMetadata Will be used to update the imported variables of the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doDynamicImportWithPromiseOperationsAfterSetup = (
  { path, addReferences },
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
  if (isImportStatementArgumentsPresent(callExpressionNode)) {
    // Will update reference count of each parsed variable, (present inside specifier AST node)
    callExpressionNode.arguments[0].params.forEach((specifier) => {
      try {
        const updateVariablesMetadata = {
          node: specifier,
          addReferences,
          importedFileAddress,
          type: "DONT_UPDATE_REFERENCE_COUNT",
        };
        updateImportedVariablesReferenceCountInRequireOrDynamicImportStatements(
          updateVariablesMetadata,
          currentFileMetadata,
          filesMetadata
        );
      } catch (_) {}
    });
  }
};

/**
 * Will be used to parse individual import(...) of each dynamic imports
 * Will parse magic comments present inside it to get the chunk in which it will be present
 * @param {Object} dynamicImportMetadata Contains information related to corresponding AST path and the stage at which this funciton is being called
 * @param {Object} currentFileMetadata Will be used to update the imported variables of the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doOperationsOnSubPartOfDynamicImports = (
  { path, operationType },
  currentFileMetadata,
  filesMetadata
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
  if (operationType === "CHECK_IMPORTS_ADDRESSES") {
    // By default each dynamic import will be present in a different chunk
    let webpackChunkName = importedFileAddress;
    // Magic comments Array
    const leadingCommentsArray =
      callExpressionNode.arguments[0].leadingComments;

    if (leadingCommentsArray) {
      leadingCommentsArray.forEach((comment) => {
        const { key, value, valid } = parseComment(comment);
        if (valid && key === "webpackChunkName") {
          webpackChunkName = value;
        }
      });
    }
    updateWebpackConfigurationOfImportedFile(
      importedFileAddress,
      webpackChunkName,
      filesMetadata
    );
  }
};

/**
 * Will be called inside const ... = lazy(()=>import(...)) type statements
 * @param {Object} dynamicImportMetadata Contains information related to AST nodes which contains address of the imported file and the imported variables, also contains the stage at which this function is called
 * @param {Object} currentFileMetadata Will be used to update the imported variables of the current file
 * @param {Object} filesMetadata Contains information related to all files
 */
const doDynamicImportsUsingLazyHookOperations = (
  { parentNode, childNode, operationType },
  currentFileMetadata,
  filesMetadata
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
      currentFileMetadata.importedVariablesMetadata[identifier] =
        getNewImportVariableObject(
          "default",
          identifier,
          "INDIVIDUAL_IMPORT",
          importedFileAddress
        );
      if (operationType === "CHECK_USAGE")
        // As we will get only the default exported variable using this statement
        currentFileMetadata.importedVariables[identifier] =
          filesMetadata.filesMapping[importedFileAddress].exportedVariables[
            "default"
          ];
    }
  } catch (_) {}
};

/**
 * Updates the references of the imported variable when used
 * @param {Object} path AST path inside which node containing the imported variable's name will be present
 * @param {Object} currentFileMetadata Contains imported variables of the current file
 * @param {Boolean} addReferences To decide whether the values have to be added or subtracted
 */
const doIdentifierOperationsOnImportedVariables = (
  path,
  currentFileMetadata,
  addReferences
) => {
  const identifierName = path.node.name;
  // If the token parsed represents an imported variable
  if (currentFileMetadata.importedVariables[identifierName]) {
    try {
      const valueToAdd = addReferences ? 1 : -1;
      currentFileMetadata.importedVariables[identifierName].referenceCount +=
        valueToAdd;
    } catch (_) {}
  }
};

/**
 * Updates the references of the imported variable's metadata when used (Used for pre-check whether a file is used or not)
 * @param {Object} path AST path inside which node containing the imported variable's name will be present
 * @param {Object} currentFileMetadata Contains imported variables of the current file
 * @param {Boolean} addReferences To decide whether the values have to be added/ subtracted
 */
const doIdentifierOperationsOnImportedVariablesMetadata = (
  path,
  currentFileMetadata,
  addReferences
) => {
  const identifierName = path.node.name;
  // If the token parsed represents an imported variable
  if (currentFileMetadata.importedVariablesMetadata[identifierName]) {
    try {
      const valueToAdd = addReferences ? 1 : -1;
      currentFileMetadata.importedVariablesMetadata[
        identifierName
      ].referenceCountObject.referenceCount += valueToAdd;
      if (!isNotExportTypeReference(path))
        currentFileMetadata.importedVariablesMetadata[identifierName]
          .referenceCountObject.exportReferenceCount++;
    } catch (_) {}
  }
};

module.exports = {
  doIdentifierOperationsOnImportedVariables,
  doIdentifierOperationsOnImportedVariablesMetadata,
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
