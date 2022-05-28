const { default: traverse } = require("@babel/traverse");
const { parse } = require("@babel/parser");
const path = require("path");
const fs = require("fs");
const enhancedResolve = require("enhanced-resolve");

const traverseAST = (tree, currentFileMetadata) => {
  traverse(tree, {
    ImportDeclaration(astPath) {
      const fileLocation = currentFileMetadata.fileLocation;
      const importedFileAddress = path.isAbsolute(astPath.node.source.value)
        ? astPath.node.source.value
        : pathResolver(path.dirname(fileLocation), astPath.node.source.value);
      currentFileMetadata.importedFilesMapping[importedFileAddress] =
        getDefaultFileObject(importedFileAddress);
      astPath.node.specifiers.forEach((specifier) => {
        const localEntityName = specifier.local.name;
        let importedEntityName;
        let importReferenceCount;
        if (specifier.type === "ImportSpecifier") {
          importedEntityName = specifier.imported.name;
        }
        importReferenceCount = importedEntityName === localEntityName ? 2 : 1;
        currentFileMetadata.importedFilesMapping[
          importedFileAddress
        ].importReferenceCount += importReferenceCount;
        currentFileMetadata.entityMapping[localEntityName] = {
          name: importedEntityName,
          localName: localEntityName,
          importedFrom: importedFileAddress,
          referenceCount: 0,
          importReferenceCount,
        };
      });
    },
    Identifier(path) {
      const identifierName = path.node.name;
      if (currentFileMetadata.entityMapping[identifierName]) {
        try {
          currentFileMetadata.entityMapping[identifierName].referenceCount++;
          const importedFrom =
            currentFileMetadata.entityMapping[identifierName].importedFrom;
          currentFileMetadata.importedFilesMapping[importedFrom]
            .referencedCount++;
        } catch (_) {}
      }
    },
    JSXIdentifier(path) {
      const identifierName = path.node.name;
      if (
        currentFileMetadata.entityMapping[identifierName] &&
        typeof currentFileMetadata.entityMapping[identifierName] !== "function"
      ) {
        currentFileMetadata.entityMapping[identifierName].referenceCount++;
        const importedFrom =
          currentFileMetadata.entityMapping[identifierName].importedFrom;
        currentFileMetadata.importedFilesMapping[importedFrom]
          .referencedCount++;
      }
    },
  });
};

const getDefaultFileObject = (fileLocation) => {
  return {
    name: path.basename(fileLocation),
    fileLocation: fileLocation,
    referencedCount: 0,
    importReferenceCount: 0,
    isEntryFile: false,
  };
};

const buildAST = (fileLocation) => {
  const code = fs.readFileSync(fileLocation).toString();
  return parse(code, {
    sourceType: "module",
    plugins: [
      "jsx",
      "typescript",
      "asyncDoExpressions",
      "decimal",
      "decorators-legacy",
      "decoratorAutoAccessors",
      "destructuringPrivate",
      "doExpressions",
      "exportDefaultFrom",
      "functionBind",
      "importAssertions",
      "moduleBlocks",
      "partialApplication",
      "regexpUnicodeSets",
      "throwExpressions",
      "asyncGenerators",
      "bigInt",
      "classProperties",
      "classPrivateProperties",
      "classPrivateMethods",
      "classStaticBlock",
      "dynamicImport",
      "exportNamespaceFrom",
      "functionSent",
      "logicalAssignment",
      "moduleStringNames",
      "nullishCoalescingOperator",
      "numericSeparator",
      "objectRestSpread",
      "optionalCatchBinding",
      "optionalChaining",
      "privateIn",
      "topLevelAwait",
    ],
    attachComment: false,
    errorRecovery: true,
  });
};

const pathResolver = (directoryName, fileName) => {
  return enhancedResolve.sync(directoryName, fileName);
};
const directoryResolver = (directoryName, givenDirectoryAddress) => {
  if (!path.isAbsolute(givenDirectoryAddress))
    return path.join(directoryName, givenDirectoryAddress);
  return givenDirectoryAddress;
};
const allFilesFinder = async (
  directoryLocation,
  visitedDirectoriesMapping,
  excludedPointsRegex
) => {
  if (
    visitedDirectoriesMapping[directoryLocation] ||
    excludedPointsRegex.test(directoryLocation)
  )
    return [];
  visitedDirectoriesMapping[directoryLocation] = true;
  const allFilesAndDirectories = await fs.promises.readdir(directoryLocation, {
    withFileTypes: true,
  });
  const allFiles = [];
  for (const file of allFilesAndDirectories) {
    if (file.isDirectory()) {
      const subFolderFiles = await allFilesFinder(
        path.join(directoryLocation, file.name).toString(),
        visitedDirectoriesMapping,
        excludedPointsRegex
      );
      subFolderFiles.forEach((file) => allFiles.push(file));
    } else {
      const fileLocation = path.join(directoryLocation, file.name).toString();
      if (!excludedPointsRegex.test(fileLocation)) allFiles.push(fileLocation);
    }
  }
  return allFiles;
};
const updateFilesMetadata = (filesMetadata, currentFileMetadata) => {
  const filesMapping = filesMetadata.filesMapping;
  const currentFileMapping = currentFileMetadata.importedFilesMapping;
  for (let index in currentFileMapping) {
    if (filesMapping[index]) {
      filesMapping[index].referencedCount +=
        currentFileMapping[index].referencedCount;
      filesMapping[index].importReferenceCount +=
        currentFileMapping[index].importReferenceCount;
    } else filesMapping[index] = currentFileMapping[index];
  }
};

const getAllFiles = async (
  allDirectories,
  visitedDirectoriesMapping,
  excludedPointsRegex
) => {
  const allFiles = [];
  for (const directory of allDirectories) {
    const directoyAbsoluteAddress = directoryResolver(__dirname, directory);
    if (!fs.statSync(directoyAbsoluteAddress).isDirectory()) {
      if (!excludedPointsRegex.test(directoyAbsoluteAddress))
        allFiles.push(directoyAbsoluteAddress);
      continue;
    }

    const directoriesFiles = await allFilesFinder(
      directoyAbsoluteAddress,
      visitedDirectoriesMapping,
      excludedPointsRegex
    );
    directoriesFiles.forEach((file) => {
      allFiles.push(file);
    });
  }
  return allFiles;
};

const buildExcludedPointsRegex = (excludedPointsArray) => {
  let regexStr = "";
  if (excludedPointsArray.length) {
    regexStr += "^(";
    excludedPointsArray.forEach((point) => {
      const pointAbsoluteAddress = directoryResolver(__dirname, point);
      regexStr += `${pointAbsoluteAddress}|`;
    });
    regexStr = regexStr.slice(0, -1);
    regexStr += ")";
  } else {
    regexStr = "!^()";
  }
  const excludedPointsRegex = new RegExp(regexStr);
  return excludedPointsRegex;
};

const buildIntraModuleDependencyRegex = (moduleLocation) => {
  const siblingLocation = path.join(path.dirname(moduleLocation),'.+');
  return new RegExp(`(?=^${siblingLocation})(?!^${moduleLocation})`);
};
module.exports = {
  traverseAST,
  buildAST,
  pathResolver,
  allFilesFinder,
  updateFilesMetadata,
  getDefaultFileObject,
  directoryResolver,
  getAllFiles,
  buildExcludedPointsRegex,
  buildIntraModuleDependencyRegex,
};
