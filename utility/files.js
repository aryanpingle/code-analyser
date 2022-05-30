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

const getAllEntryFiles = async (
  entryArray,
  allFilesToCheck,
  excludedPointsRegex
) => {
  const visitedEntryDirectoriesMapping = {};
  const entryFiles = [];
  for (const entry of entryArray) {
    // console.log(entry)
    if (entry instanceof RegExp) {
      allFilesToCheck.forEach((file) => {
        if (entry.test(file) && !excludedPointsRegex.test(file)) {
          entryFiles.push(file);
        }
      });
    } else {
      const filesInsideThisDirectory = await getAllFiles(
        [entry],
        visitedEntryDirectoriesMapping,
        excludedPointsRegex
      );
      filesInsideThisDirectory.forEach((file) => entryFiles.push(file));
    }
  }
  return entryFiles;
};

const getAllFilesToCheck = async (directoriesToCheck, excludedPointsRegex) => {
  const visitedDirectoriesToCheckMapping = {};
  return await getAllFiles(
    directoriesToCheck,
    visitedDirectoriesToCheckMapping,
    excludedPointsRegex
  );
};
const getDefaultFilesMetadata = (excludedPointsRegex) => {
  return {
    filesMapping: {},
    visitedFilesMapping: {},
    excludedPointsRegex,
    unparsableVistedFiles: 0,
  };
};

const setDefaultFilesMetadata = (filesMetadata) => {
  filesMetadata.filesMapping = {};
  filesMetadata.visitedDirectoriesMapping = {};
  filesMetadata.unparsableVistedFiles = 0;
};

module.exports = {
  updateFilesMetadata,
  getAllFiles,
  getAllEntryFiles,
  getAllFilesToCheck,
  getDefaultFilesMetadata,
  setDefaultFilesMetadata,
};
