const {
  checkFileUsage,
  checkDeadFileImportsUsage,
} = require("../checker/file-usage");
const { checkFileImportExports } = require("../checker/file-imports-exports");
const { checkFileImports } = require("../checker/file-imports");
const { getAllEntryFiles, getAllFilesToCheck } = require("./files");
const {
  isFilePath,
  getNumberOfSubPartsOfGivenAbsolutePath,
} = require("./resolver");
const { isFileNotExcluded, isFileExtensionValid } = require("./helper");
const { CHUNKS, DEFAULT, DISPLAY_TEXT } = require("./constants");
const process = require("process");

/**
 * Used to get all the statically imported files addresses on which the entry files depend
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 */
const setAllStaticallyImportedFilesMapping = (allEntryFiles, filesMetadata) => {
  allEntryFiles.forEach((file) => {
    checkFileImports(file, filesMetadata, true);
  });
};

/**
 * Used to get all the imported files addresses on which the entry files depend
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 */
const setAllImportedFilesMapping = (allEntryFiles, filesMetadata) => {
  allEntryFiles.forEach((file) => {
    checkFileImports(file, filesMetadata, false);
  });
};

/**
 * Sets each file's exported variables which will be used later on during the CHECK_USAGE stage
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Object} entryFilesMapping Mapping to check whether a file is an entry file or not
 */
const setAllFileExports = (allEntryFiles, filesMetadata, entryFilesMapping) => {
  allEntryFiles.forEach((entryFile) =>
    checkFileImportExports(entryFile, filesMetadata, entryFilesMapping)
  );
};

/**
 * Analyses the code and updates the references of parsed files
 * @param {Array} allEntryFiles Array containing all entry files
 * @param {Object} filesMetadata Contains information related to all files
 */
const analyseCode = (allEntryFiles, filesMetadata) => {
  allEntryFiles.forEach((entryFile) =>
    checkFileUsage(entryFile, filesMetadata)
  );
  process.send({
    text: "Analysed the codebase",
    messageType: DISPLAY_TEXT,
  });
};

/**
 * Used to find dead files present in the feasible array of files provided
 * Also sends message to parent process whether it identified all dead files successfully or not
 * @param {Array} allFilesToCheck Array of feasible files which have to be checked for dead files
 * @param {Object} filesMetadata Contains information related to all files
 * @returns Array of dead files found inside the allFilesToCheck array
 */
const getDeadFilesAndSendMessageToParent = (allFilesToCheck, filesMetadata) => {
  const allDeadFiles = getAllDeadFiles(filesMetadata, allFilesToCheck);
  // If no errors were found while parsing these files
  if (filesMetadata.unparsableVistedFiles === 0)
    process.send({
      text: "Successfully identified all dead files",
      messageType: DISPLAY_TEXT,
    });
  else
    process.send({
      text: "Unable to identify few dead files",
      messageType: DISPLAY_TEXT,
    });

  return allDeadFiles;
};

/**
 * Checks for all dependencies at a provided depth which were actually referred by any file
 * @param {Object} outsideModuleChecker Regex to decide whether a given file is a dependency at a given depth or not
 * @param {Object} filesMetadata Contains information related to all files
 * @returns Array of files which are dependencies at a given depth of the provided module location
 */
const getDependenciesAtGivenDepth = (outsideModuleChecker, filesMetadata) => {
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const dependenciesAtGivenDepthArray = [];
  const filesMapping = filesMetadata.filesMapping;
  for (const file in filesMapping) {
    if (
      // If the file is not excluded, satisfies dependency at a given depth condition, and is also reffered
      outsideModuleChecker.test(file) &&
      isFilePath(file) &&
      isFileNotExcluded(excludedFilesRegex, file)
    ) {
      dependenciesAtGivenDepthArray.push({
        file,
        filePoints: getFilePoints(file, filesMapping),
      });
    }
  }
  // If no errors found during traversal
  if (filesMetadata.unparsableVistedFiles === 0)
    process.send({
      text: "Successfully identified all dependencies at the provided depth",
      messageType: DISPLAY_TEXT,
    });
  else
    process.send({
      text: "Unable to identify few ddependencies at the provided depth",
      messageType: DISPLAY_TEXT,
    });

  return dependenciesAtGivenDepthArray;
};

/**
 * Will be used to retrieve all dead files present
 * Will recursively check whether a dead file's imported files are dead files too or not
 * @param {Object} filesMetadata Contains information related to all files
 * @param {Array} allFilesToCheck Array consisting of all files we have to check to detect dead files
 * @returns Array of dead files
 */
const getAllDeadFiles = (filesMetadata, allFilesToCheck) => {
  const filesMapping = filesMetadata.filesMapping;
  const deadFileVisitedMapping = {};
  const deadFilesArray = allFilesToCheck
    .filter((file) => {
      return (
        // Either file was never imported/ referred or if imported but never used
        !filesMapping[file] ||
        (filesMapping[file].isEntryFile === false &&
          !isFileReferred(filesMapping, file))
      );
    })
    .map((file) => {
      deadFileVisitedMapping[file] = true;
      return { file, filePoints: getFilePoints(file, filesMapping) };
    });

  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  for (const fileObject of deadFilesArray) {
    const file = fileObject.file;
    deadFileVisitedMapping[file] = true;
    if (filesMapping[file]) {
      // Will be used to check whether imports of a dead file where referred inside this file only, if so then they will also become dead file now
      checkDeadFileImportsUsage(file, filesMetadata);
      for (const importedFile in filesMapping[file].importedFilesMapping) {
        if (
          // First we haven't checked that file
          !deadFileVisitedMapping[importedFile] &&
          // File isn't excluded
          isFileNotExcluded(excludedFilesRegex, importedFile) &&
          // And it is a dead file too
          (!filesMapping[importedFile] ||
            (filesMapping[importedFile].isEntryFile === false &&
              !isFileReferred(filesMapping, importedFile)))
        ) {
          deadFileVisitedMapping[importedFile] = true;
          deadFilesArray.push({
            file: importedFile,
            filePoints: getFilePoints(importedFile, filesMapping),
          });
        }
      }
    }
  }
  return deadFilesArray;
};

/**
 * Used to determine the significance of a particular file
 * @param {String} file Absolute address of a file
 * @param {Object} filesMapping Contains information related to all files
 * @returns Points associated with the provided file
 */
const getFilePoints = (file, filesMapping) => {
  let filePoints = 0;
  if (isFileExtensionValid(file)) filePoints += 100;
  // If never referred
  if (!filesMapping[file]) filePoints += 10;
  // If present deep inside a parent folder, then it's significance is lower as compared to those present closer to a parent folder
  filePoints -= getNumberOfSubPartsOfGivenAbsolutePath(file);
  return filePoints;
};

/**
 * Checks if a file is not a dead file and was actually used by some other file
 * @param {Object} filesMapping Contains information related to all files
 * @param {String} fileLocation Address of the file which has to be check
 * @returns Boolean value denoting whether this file was referred or not
 */
const isFileReferred = (filesMapping, fileLocation) => {
  let isReferred = false;
  if (!filesMapping[fileLocation]) return false;
  const allExportedVariables = filesMapping[fileLocation].exportedVariables;
  try {
    // If the entire object of the file was referred
    const referencesUsingThisFile = getReferencesOfVariableUsingGivenFile(
      allExportedVariables,
      fileLocation
    );
    if (referencesUsingThisFile || allExportedVariables.isEntryFileObject) {
      isReferred = true;
    }
  } catch (_) {}
  if (isReferred) return true;
  for (const variable in allExportedVariables) {
    try {
      const referencesUsingThisFile = getReferencesOfVariableUsingGivenFile(
        allExportedVariables[variable],
        fileLocation
      );
      if (
        referencesUsingThisFile ||
        allExportedVariables[variable].isEntryFileObject
      ) {
        isReferred = true;
        break;
      }
      // default exports can contain many exports declared inside this file itself
      if (variable === DEFAULT) {
        for (const variablesInsideDefault in allExportedVariables[variable]) {
          try {
            const referencesUsingThisFile =
              getReferencesOfVariableUsingGivenFile(
                allExportedVariables[variable][variablesInsideDefault],
                fileLocation
              );
            if (
              referencesUsingThisFile ||
              allExportedVariables[variable][variablesInsideDefault]
                .isEntryFileObject
            ) {
              isReferred = true;
              break;
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
  return isReferred;
};

/**
 * Used to check the references of a particular variable made using a file which exports this variable
 * @param {Object} variable Variable to check
 * @param {String} fileLocation Absolute address of the provided file
 * @returns Integer denoting references made using this file
 */
const getReferencesOfVariableUsingGivenFile = (variable, fileLocation) => {
  let referencesUsingThisFile = variable.referenceCount;
  if (
    variable.individualFileReferencesMapping &&
    variable.individualFileReferencesMapping[fileLocation]
  ) {
    // If file refers this variable too, then remove those references
    referencesUsingThisFile -=
      variable.individualFileReferencesMapping[fileLocation].referenceCount -
      variable.individualFileReferencesMapping[fileLocation]
        .exportReferenceCount;
  }
  return referencesUsingThisFile;
};
/**
 * Used to get all files required by the program
 * @param {Object} programConfiguration Contains information related to which directories, entry files have to be retrieved
 * @param {RegExp} excludedFilesRegex Regex denoting the excluded files
 * @returns Object consisting of arrays of entry files and the files to check
 */
const getAllRequiredFiles = async (
  programConfiguration,
  excludedFilesRegex
) => {
  const allFilesToCheck = await getAllFilesToCheck(
    programConfiguration.directoriesToCheck,
    excludedFilesRegex
  );
  process.send({
    text: "Successfully retrieved all files inside the directories to check",
    messageType: DISPLAY_TEXT,
  });

  const allEntryFiles = await getAllEntryFiles(
    programConfiguration.entry,
    allFilesToCheck,
    excludedFilesRegex
  );
  process.send({
    text: "Successfully retrieved all entry files",
    messageType: DISPLAY_TEXT,
  });

  return { allEntryFiles, allFilesToCheck };
};

/**
 * Will be used to create a new Data Structure which will contain information of each file and the chunks inside which it is present
 * @param {Object} filesMetadata Contains information related to all files
 * @returns Data Structure containing mapping of file and it's dependencies and the chunks inside which it is present
 */
const createWebpackChunkMetadata = (filesMetadata) => {
  const allFilesChunksMetadata = {};
  const filesMapping = filesMetadata.filesMapping;
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  for (const file in filesMapping) {
    if (!isFileNotExcluded(excludedFilesRegex, file)) continue;
    if (!allFilesChunksMetadata[file]) {
      allFilesChunksMetadata[file] = generateDefaultFileChunksObject(
        filesMetadata,
        file
      );
    }
    for (const chunkName in filesMapping[file].webpackChunkConfiguration) {
      allFilesChunksMetadata[file].chunks.push(chunkName);
    }
    for (const importedFile in filesMapping[file].staticImportFilesMapping) {
      if (!isFileNotExcluded(excludedFilesRegex, importedFile)) continue;
      if (!allFilesChunksMetadata[importedFile])
        allFilesChunksMetadata[importedFile] = generateDefaultFileChunksObject(
          filesMetadata,
          importedFile
        );
      allFilesChunksMetadata[importedFile][file] = allFilesChunksMetadata[file];
    }
  }
  process.send({
    text: "Established relationship between different files",
    messageType: DISPLAY_TEXT,
  });

  return allFilesChunksMetadata;
};

/**
 * Used to create a new object which will contain the chunks inside which this file is present initially
 * @param {Object} filesMetadata Contains information related to all files
 * @param {String} fileLocation Absolute address of the file to check
 * @returns Object containing an array of initial chunks inside which the given file is present
 */
const generateDefaultFileChunksObject = (filesMetadata, fileLocation) => {
  const defaultObject = { chunks: [] };
  if (filesMetadata.filesMapping[fileLocation].isEntryFile) {
    defaultObject.chunks.push(fileLocation);
  }
  return defaultObject;
};

/**
 * Displays the files (along with the chunks inside which it is present) which are present in more than one chunk on the console
 * @param {Object} webpackChunkMetadata Data Structure containing information related to the chunks inside which a file is present
 */
const getDuplicateFiles = (webpackChunkMetadata) => {
  const fileWebpackChunkMapping = {};
  const duplicateFilesDetails = [];
  for (const file in webpackChunkMetadata) {
    const fileChunksSet = getAllRelatedChunks(
      file,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (fileChunksSet.size > 1) {
      duplicateFilesDetails.push({
        file,
        chunksArray: Array.from(fileChunksSet),
      });
    }
  }
  return duplicateFilesDetails;
};

/**
 * Used to get all the chunks inside which a given file is present, will use DFS along with memoization to retrieve the information
 * @param {String} fileLocation Absolute address of the file to check
 * @param {Object} webpackChunkMetadata Data Structure containing information related to the chunks inside which a file is present
 * @param {Object} fileWebpackChunkMapping Mapping to check whether all the chunks inside which a file is present have been retrieved
 * @returns Set of chunks inside which the given file is present
 */
const getAllRelatedChunks = (
  fileLocation,
  webpackChunkMetadata,
  fileWebpackChunkMapping
) => {
  if (fileWebpackChunkMapping[fileLocation])
    return fileWebpackChunkMapping[fileLocation];
  const fileChunksSet = new Set(webpackChunkMetadata[fileLocation].chunks);
  fileWebpackChunkMapping[fileLocation] = fileChunksSet;
  for (const dependentFile in webpackChunkMetadata[fileLocation]) {
    if (dependentFile === CHUNKS) continue;
    if (fileWebpackChunkMapping[dependentFile]) {
      if (fileWebpackChunkMapping[dependentFile].size) {
        for (const dependentChunk of fileWebpackChunkMapping[dependentFile])
          fileChunksSet.add(dependentChunk);
      }
      continue;
    }
    const dependentFileChunksSet = getAllRelatedChunks(
      dependentFile,
      webpackChunkMetadata,
      fileWebpackChunkMapping
    );
    if (dependentFileChunksSet.size) {
      for (const dependentChunk of dependentFileChunksSet)
        fileChunksSet.add(dependentChunk);
    }
  }
  fileWebpackChunkMapping[fileLocation] = fileChunksSet;
  return fileChunksSet;
};

/**
 * Used to check whether a file is an entry file or not
 * @param {Array} entryFilesArray Array of entry files
 * @returns Mapping of files
 */
const buildEntryFilesMappingFromArray = (entryFilesArray) => {
  const entryFilesMapping = {};
  entryFilesArray.forEach((file) => (entryFilesMapping[file] = true));
  return entryFilesMapping;
};

/**
 * Will generate a mapping containing information related to dependency at a given depth and the files which import them
 * @param {Array} dependenciesAtGivenDepthArray Array containing the dependencies at a given depth
 * @param {Object} filesMetadata
 */
const getDependenciesAtGivenDepthUsageMapping = (
  dependenciesAtGivenDepthArray,
  filesMetadata
) => {
  const dependenciesUsageMapping = {};
  dependenciesAtGivenDepthArray.forEach(
    (fileObject) => (dependenciesUsageMapping[fileObject.file] = [])
  );
  for (const file in filesMetadata.filesMapping) {
    for (const dependentFile in filesMetadata.filesMapping[file]
      .staticImportFilesMapping) {
      if (dependenciesUsageMapping[dependentFile]) {
        dependenciesUsageMapping[dependentFile].push(file);
      }
    }
  }
  return dependenciesUsageMapping;
};

/**
 * Generates a mapping from given duplicate files array,
 * contains information related to the duplicate files and the chunks inside which they are present
 * @param {Array} duplicateFilesArray
 */
const getDuplicateFilesChunksMapping = (duplicateFilesArray) => {
  const duplicateFilesChunksMapping = {};
  duplicateFilesArray.forEach((fileObject) => {
    duplicateFilesChunksMapping[fileObject.file] = fileObject.chunksArray;
  });
  return duplicateFilesChunksMapping;
};

module.exports = {
  setAllStaticallyImportedFilesMapping,
  setAllImportedFilesMapping,
  setAllFileExports,
  createWebpackChunkMetadata,
  analyseCode,
  getDeadFilesAndSendMessageToParent,
  getDependenciesAtGivenDepth,
  getAllRequiredFiles,
  getDuplicateFiles,
  buildEntryFilesMappingFromArray,
  getDependenciesAtGivenDepthUsageMapping,
  getDuplicateFilesChunksMapping,
};
