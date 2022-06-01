const {
  getDefaultFileObject,
  setRequiredVariablesObjects,
  updateImportSpecifierAndCurrentFileReferenceCount,
  getResolvedPathFromGivenPath,
  setDefaultReferenceCount,
  updateExportSpecifierAndCurrentFileReferenceCount,
  getImportedFileAddress,
  updateWebpackConfigurationOfImportedFile,
  parseComment,
  getNewWebpackConfigurationObject,
  getResolvedImportedFileDetails,
} = require("./utility");
const { getDirectoryFromPath } = require("../utility/resolver");
const {
  isRequireOrImportStatement,
  isFileMappingNotPresentInCurrentFile,
  isSpecifiersPresent,
  isImportStatementArgumentsPresent,
} = require("./conditional-expressions-checks");

const doIdentifierOperations = (path, currentFileMetadata) => {
  const identifierName = path.node.name;
  if (currentFileMetadata.entityMapping[identifierName]) {
    try {
      currentFileMetadata.entityMapping[identifierName].referenceCount++;
      const importedFrom =
        currentFileMetadata.entityMapping[identifierName].importedFrom;
      currentFileMetadata.importedFilesMapping[importedFrom].referenceCount++;
    } catch (_) {}
  }
};

const doAssignmentOperations = (
  nodeToGetAddress,
  nodeToGetValues,
  currentFileMetadata
) => {
  if (isRequireOrImportStatement(nodeToGetAddress)) {
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
      currentFileMetadata.importedFilesMapping[importedFileAddress] =
        getDefaultFileObject(importedFileAddress, type);
    setRequiredVariablesObjects(
      nodeToGetValues,
      currentFileMetadata,
      importedFileAddress
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
    currentFileMetadata.importedFilesMapping[importedFileAddress] =
      getDefaultFileObject(importedFileAddress, type);

  if (isSpecifiersPresent(node)) {
    node.specifiers.forEach((specifier) => {
      updateImportSpecifierAndCurrentFileReferenceCount(
        specifier,
        currentFileMetadata,
        importedFileAddress
      );
    });
  } else {
    setDefaultReferenceCount(
      currentFileMetadata,
      importedFileAddress,
      doImportDeclartionOperations
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
    currentFileMetadata.importedFilesMapping[importedFileAddress] =
      getDefaultFileObject(importedFileAddress, type);

  if (isSpecifiersPresent(node)) {
    node.specifiers.forEach((specifier) => {
      updateExportSpecifierAndCurrentFileReferenceCount(
        currentFileMetadata,
        importedFileAddress
      );
    });
  } else setDefaultReferenceCount(currentFileMetadata, importedFileAddress);
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
    currentFileMetadata.importedFilesMapping[importedFileAddress] =
      getDefaultFileObject(importedFileAddress, type);
  if (isImportStatementArgumentsPresent(callExpressionNode)) {
    const argumentValue = callExpressionNode.arguments[0].params[0];
    setRequiredVariablesObjects(
      argumentValue,
      currentFileMetadata,
      importedFileAddress
    );
  }
};

const doOperationsOnFirstPartOfDynamicImports = (path, currentFileMetadata) => {
  const fileLocation = currentFileMetadata.fileLocation;
  const callExpressionNode = path.node;
  const node = callExpressionNode.callee;
  const { type: importType, address: givenSourceAdress } =
    getImportedFileAddress(callExpressionNode);
  const { importedFileAddress } = getResolvedPathFromGivenPath(
    fileLocation,
    givenSourceAdress,
    importType
  );
  const webpackConfiguration =
    getNewWebpackConfigurationObject(importedFileAddress);

  const leadingCommentsArray = callExpressionNode.arguments[0].leadingComments;

  if (leadingCommentsArray) {
    leadingCommentsArray.forEach((comment) => {
      const { key, value, valid } = parseComment(comment);
      if (valid) webpackConfiguration[key] = value;
    });
  }
  updateWebpackConfigurationOfImportedFile(
    currentFileMetadata,
    importedFileAddress,
    webpackConfiguration
  );
};
module.exports = {
  doIdentifierOperations,
  doAssignmentOperations,
  doImportDeclartionOperations,
  doExportDeclarationOperations,
  doDynamicImportWithPromiseOperations,
  doOperationsOnFirstPartOfDynamicImports,
};
