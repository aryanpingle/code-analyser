import { codeAnalyserConfigurationObject } from "../utility/configuration.js";
import { CHECK_DEAD_FILES } from "../utility/constants.js";
import {
  getDeadFilesAndSendMessageToParent,
  analyseCode,
  setAllFilesExports,
  buildEntryFilesMappingFromArray,
  getAllRequiredFiles,
} from "../utility/featureSpecificOperations/index.js";

/**
 * Function which first analyses the code and prints the dead files present on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
export const analyseCodeAndDetectDeadfiles = async (
  filesMetadata,
  programConfiguration
) => {
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles, allFilesToCheck } = await getAllRequiredFiles(
    {
      directoriesToCheck: programConfiguration.directoriesToCheck,
      entry: programConfiguration.entry,
    },
    excludedFilesRegex
  );
  const entryFilesMapping = buildEntryFilesMappingFromArray(allEntryFiles);
  setAllFilesExports(allEntryFiles, filesMetadata, entryFilesMapping);
  // Reset the visited files, will traverse them again
  filesMetadata.visitedFilesMapping = {};
  analyseCode(allEntryFiles, filesMetadata);
  const allDeadFiles = getDeadFilesAndSendMessageToParent(
    allFilesToCheck,
    filesMetadata
  );
  const filesLengthObject = {
    deadFiles: allDeadFiles.length,
    filesToCheck: allFilesToCheck.length,
    entryFiles: allEntryFiles.length,
  };
  process.send({
    filesMetadata,
    filesLengthObject,
    filesArray: allDeadFiles,
    messageType: CHECK_DEAD_FILES,
    interact: codeAnalyserConfigurationObject.interact,
  });
};
