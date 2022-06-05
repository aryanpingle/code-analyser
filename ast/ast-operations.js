const {
  setRequiredVariablesObjects,
  updateImportSpecifierAndCurrentFileReferenceCount,
  getResolvedPathFromGivenPath,
  updateExportSpecifierAndCurrentFileReferenceCount,
  getImportedFileAddress,
  updateWebpackConfigurationOfImportedFile,
  parseComment,
  getNewWebpackConfigurationObject,
  getResolvedImportedFileDetails,
  getValuesFromStatement,
  setExportedVariablesFromArray,
  getAllPropertiesFromNode,
} = require("./utility");
const { getDirectoryFromPath } = require("../utility/resolver");
const {
  isRequireOrImportStatement,
  isFileMappingNotPresentInCurrentFile,
  isSpecifiersPresent,
  isImportStatementArgumentsPresent,
  isModuleExportStatement,
  isRequireStatement,
} = require("./conditional-expressions-checks");

const doIdentifierOperations = (path, currentFileMetadata) => {
  const identifierName = path.node.name;
  if (
    /components\/app/.test(currentFileMetadata.fileLocation) &&
    identifierName === "X"
  )
    console.log(identifierName, currentFileMetadata.importedVariables);

  if (currentFileMetadata.importedVariables[identifierName]) {
    try {
      currentFileMetadata.importedVariables[identifierName].referenceCount++;
    } catch (_) {}
  }
};

const doRequireOrImportStatementOperations = (
  nodeToGetAddress,
  nodeToGetValues,
  currentFileMetadata,
  filesMetadata,
  operationType = "CHECK_USAGE"
) => {
  const { type: importType, address: givenSourceAdress } =
    getImportedFileAddress(nodeToGetAddress);
  const fileLocation = currentFileMetadata.fileLocation;
  const { type, fileAddress: importedFileAddress } =
    getResolvedImportedFileDetails(
      getDirectoryFromPath(fileLocation),
      givenSourceAdress,
      importType
    );
  if (
    isFileMappingNotPresentInCurrentFile(
      importedFileAddress,
      currentFileMetadata
    )
  )
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (operationType === "CHECK_USAGE") {
    setRequiredVariablesObjects(
      nodeToGetValues,
      currentFileMetadata,
      importedFileAddress,
      filesMetadata,
      "RequireStatement"
    );
  }
};

const doImportDeclartionOperations = (node, currentFileMetadata) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAdress = node.source.value;
  const { type, importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress
  );
  if (
    isFileMappingNotPresentInCurrentFile(
      importedFileAddress,
      currentFileMetadata
    )
  )
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (isSpecifiersPresent(node)) {
    node.specifiers.forEach((specifier) => {
      updateImportSpecifierAndCurrentFileReferenceCount(
        specifier,
        currentFileMetadata,
        importedFileAddress
      );
    });
  }
};

const doImportDeclartionOperationsAfterSetup = (
  node,
  currentFileMetadata,
  filesMetadata,
  operationType = "Import"
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAdress = node.source.value;
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (isSpecifiersPresent(node) && operationType === "Import") {
    node.specifiers.forEach((specifier) => {
      let type = "ALL_EXPORTS_IMPORTED";

      let localEntityName;
      if (specifier.local) localEntityName = specifier.local.name;
      else localEntityName = specifier.exported.name;
      let importedEntityName = localEntityName;
      if (specifier.type === "ImportSpecifier") {
        importedEntityName = specifier.imported.name;
        type = "INDIVIDUAL_IMPORT";
      } else if (specifier.type === "ImportDefaultSpecifier") {
        importedEntityName = "default";
        type = "INDIVIDUAL_IMPORT";
      }
      try {
        if (type === "ALL_EXPORTS_IMPORTED") {
          currentFileMetadata.importedVariables[localEntityName] =
            filesMetadata.filesMapping[importedFileAddress].exportedVariables;
          if (
            !currentFileMetadata.importedVariables[localEntityName]
              .referenceCount
          ) {
            currentFileMetadata.importedVariables[
              localEntityName
            ].referenceCount = 0;
            currentFileMetadata.importedVariables[
              localEntityName
            ].importReferenceCount = 0;
          }
          if (currentFileMetadata.importedVariables[variable]) {
            currentFileMetadata.importedVariables[variable].referenceCount += 1;
            currentFileMetadata.importedVariables[
              variable
            ].importReferenceCount += 1;
          }
        } else if (type === "INDIVIDUAL_IMPORT") {
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
    if (operationType === "Import") {
      filesMetadata.filesMapping[importedFileAddress].exportedVariables[
        "default"
      ].referenceCount += 1;
    }
  }
};
const doModuleExportStatementOperations = (
  nodeToGetValues,
  nodeToCheck,
  currentFileMetadata,
  filesMetadata
) => {
  if (isModuleExportStatement(nodeToCheck)) {
    const exportedVariablesArray = getValuesFromStatement(nodeToGetValues);
    setExportedVariablesFromArray(
      exportedVariablesArray,
      currentFileMetadata,
      filesMetadata
    );
  }
};

const doExportDeclarationOperations = (node, currentFileMetadata) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const givenSourceAdress = node.source.value;
  const { type, importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress
  );
  if (
    isFileMappingNotPresentInCurrentFile(
      importedFileAddress,
      currentFileMetadata
    )
  )
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;

  if (isSpecifiersPresent(node)) {
    node.specifiers.forEach((specifier) => {
      updateExportSpecifierAndCurrentFileReferenceCount(
        specifier,
        currentFileMetadata,
        importedFileAddress
      );
    });
  }
};

const doExportSpecifiersOperations = (
  nodeToGetValues,
  currentFileMetadata,
  filesMetadata,
  type
) => {
  if (nodeToGetValues.source) {
    const { importedFileAddress } = getResolvedPathFromGivenPath(
      currentFileMetadata.fileLocation,
      nodeToGetValues.source.value
    );
    if (nodeToGetValues.specifiers) {
      nodeToGetValues.specifiers.forEach((specifier) => {
        let specifierType = "ALL_EXPORTS_EXPORTED";
        let importName = specifier.exported.name;
        let localName = importName;
        if (specifier.type === "ExportSpecifier") {
          specifierType = "INDIVIDUAL_IMPORT";
          localName = specifier.local.name;
        } else if (specifier.type === "ExportNamespaceSpecifier") {
          specifierType = "ALL_EXPORTS_AS_OBJECT";
        }

        if (
          specifierType === "ALL_EXPORTS_EXPORTED" ||
          specifierType === "ALL_EXPORTS_AS_OBJECT"
        ) {
          currentFileMetadata.exportedVariables[importName] =
            filesMetadata.filesMapping[importedFileAddress].exportedVariables;
          if (
            !currentFileMetadata.exportedVariables[importName].referenceCount
          ) {
            currentFileMetadata.exportedVariables[
              importName
            ].referenceCount = 0;
            currentFileMetadata.exportedVariables[
              importName
            ].importReferenceCount = 0;
          }
        } else if (specifierType === "INDIVIDUAL_IMPORT") {
          // if(/components\/index/.test(currentFileMetadata.fileLocation))
          // console.log(
          //   filesMetadata.filesMapping[importedFileAddress].exportedVariables[
          //     localName
          //   ]
          // );
          currentFileMetadata.exportedVariables[importName] =
            filesMetadata.filesMapping[importedFileAddress].exportedVariables[
              localName
            ];
        }
      });
    } else {
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
  // console.log(exportedVariablesArray, currentFileMetadata.fileLocation);
};

const doDynamicImportWithPromiseOperations = (path, currentFileMetadata) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const node = callExpressionNode.callee;
  const { type: importType, address: givenSourceAdress } =
    getImportedFileAddress(node.object);
  const { type, importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress,
    importType
  );
  if (
    isFileMappingNotPresentInCurrentFile(
      importedFileAddress,
      currentFileMetadata
    )
  )
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  try {
    if (isImportStatementArgumentsPresent(callExpressionNode)) {
      callExpressionNode.arguments[0].params.forEach((specifier) => {
        if (specifier.type === "ObjectPattern") {
          specifier.properties.forEach((property) => {
            const localEntityName = property.key.name;
            let importedEntityName = localEntityName;
            let exportType = "INDIVIDUAL_IMPORT";
            currentFileMetadata.importedVariables[localEntityName] = {
              name: importedEntityName,
              localName: localEntityName,
              type: exportType,
              importedFrom: importedFileAddress,
            };
          });
        } else if (specifier.type === "Identifier") {
          const localEntityName = specifier.name;
          const exportType = "ALL_EXPORTS_IMPORTED";
          currentFileMetadata.importedVariables[localEntityName] = {
            name: localEntityName,
            localName: localEntityName,
            type: exportType,
            importedFrom: importedFileAddress,
          };
        }
      });
    }
  } catch (_) {}
};

const doDynamicImportWithPromiseOperationsAfterSetup = (
  path,
  currentFileMetadata,
  filesMetadata
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const node = callExpressionNode.callee;
  const { type: importType, address: givenSourceAdress } =
    getImportedFileAddress(node.object);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress,
    importType
  );
  currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (isImportStatementArgumentsPresent(callExpressionNode)) {
    callExpressionNode.arguments[0].params.forEach((specifier) => {
      setRequiredVariablesObjects(
        specifier,
        currentFileMetadata,
        importedFileAddress,
        filesMetadata
      );
    });
  }
};
const doDynamicImportsUsingLazyHookOperations = (
  parentNode,
  childNode,
  currentFileMetadata,
  filesMetadata,
  operationType
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = childNode;
  const { type: importType, address: givenSourceAdress } =
    getImportedFileAddress(callExpressionNode);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress,
    importType
  );
  if (
    isFileMappingNotPresentInCurrentFile(
      importedFileAddress,
      currentFileMetadata
    )
  )
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  let identifier = null;
  if (parentNode.left) {
    identifier = parentNode.left.name;
  } else if (
    parentNode.declarations &&
    parentNode.declarations[0] &&
    parentNode.declarations[0].id
  ) {
    identifier = parentNode.declarations[0].id.name;
  }
  if (identifier) {
    if (operationType === "CHECK_USAGE") {
      currentFileMetadata.importedVariables[identifier] =
        filesMetadata.filesMapping[importedFileAddress].exportedVariables;
      if (!currentFileMetadata.importedVariables[identifier].referenceCount) {
        currentFileMetadata.importedVariables[identifier].referenceCount = 0;
        currentFileMetadata.importedVariables[
          identifier
        ].importReferenceCount = 0;
      }
    } else {
      currentFileMetadata.importedVariables[identifier] = {
        name: null,
        localName: identifier,
        type: "ALL_EXPORTS_IMPORTED",
        importedFrom: importedFileAddress,
      };
    }
  }
};
const doOperationsOnFirstPartOfDynamicImports = (
  path,
  currentFileMetadata,
  filesMetadata,
  operationType
) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const { type: importType, address: givenSourceAdress } =
    getImportedFileAddress(callExpressionNode);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress,
    importType
  );
  if (
    isFileMappingNotPresentInCurrentFile(
      importedFileAddress,
      currentFileMetadata
    )
  )
    currentFileMetadata.importedFilesMapping[importedFileAddress] = true;
  if (operationType === "CHECK_USAGE") {
    const webpackConfiguration =
      getNewWebpackConfigurationObject(importedFileAddress);

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

const doAccessingPropertiesOfObjectOperations = (node, currentFileMetadata) => {
  const allPropertiesArray = getAllPropertiesFromNode(node);
  if (allPropertiesArray.length === 0) return;

  if (currentFileMetadata.importedVariables[allPropertiesArray[0]]) {
    let objectToChange =
      currentFileMetadata.importedVariables[allPropertiesArray[0]];
    let currentIndex = 1,
      arrayLength = allPropertiesArray.length;
    while (
      currentIndex < arrayLength &&
      objectToChange[allPropertiesArray[currentIndex]]
    ) {
      if (!objectToChange.referenceCount) {
        objectToChange.referenceCount = 0;
        objectToChange.importReferenceCount = 0;
      }
      objectToChange.referenceCount++;
      objectToChange = objectToChange[allPropertiesArray[currentIndex]];
      currentIndex++;
    }
    objectToChange.referenceCount++;
  }
};

module.exports = {
  doIdentifierOperations,
  doRequireOrImportStatementOperations,
  doImportDeclartionOperations,
  doExportDeclarationOperations,
  doDynamicImportWithPromiseOperations,
  doOperationsOnFirstPartOfDynamicImports,
  doModuleExportStatementOperations,
  doExportSpecifiersOperations,
  doImportDeclartionOperationsAfterSetup,
  doDynamicImportWithPromiseOperationsAfterSetup,
  doDynamicImportsUsingLazyHookOperations,
  doAccessingPropertiesOfObjectOperations,
};
