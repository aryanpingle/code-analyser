const path = require("path");
const fs = require("fs");
const { directoryResolver, getPredecessorDirectory } = require("./resolver");

const getAllFiles = async (
  allDirectories,
  visitedDirectoriesMapping,
  excludedPointsRegex
) => {
  const allFiles = [];
  for (const directory of allDirectories) {
    const directoyAbsoluteAddress = directoryResolver(
      getPredecessorDirectory(__dirname, 1),
      directory
    );
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

const getAllEntryFiles = async (entry, excludedPointsRegex) => {
  const visitedEntryDirectoriesMapping = {};
  const isArray = Array.isArray(entry);
  let entryArray;
  if (!isArray) {
    entryArray = [entry.source];
  } else entryArray = entry;
  return await getAllFiles(
    entryArray,
    visitedEntryDirectoriesMapping,
    excludedPointsRegex
  );
};

const getAllFilesToCheck = async (directoriesToCheck, excludedPointsRegex) => {
  const visitedDirectoriesToCheckMapping = {};
  return await getAllFiles(
    directoriesToCheck,
    visitedDirectoriesToCheckMapping,
    excludedPointsRegex
  );
};

module.exports = {
  updateFilesMetadata,
  getAllFiles,
  getAllEntryFiles,
  getAllFilesToCheck,
};
