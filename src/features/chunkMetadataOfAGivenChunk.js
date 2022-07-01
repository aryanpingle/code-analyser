import {
  ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE,
  DISPLAY_TEXT,
  IDENTIFICATION_OF_GIVEN_FILE_CHUNK_METADATA_MESSAGE,
  CHECK_CHUNKS_METADATA_USING_GIVEN_FILE,
} from "../utility/constants.js";
import {
  setImportedFilesMapping,
  getAllDependentFiles,
} from "../utility/featureSpecificOperations/index.js";
import { resolveAddressWithProvidedDirectory } from "../utility/resolver.js";
import { cacheMapping } from "../utility/configuration.js";

/**
 * Function which first analyses the code and then prints the files which are present in more than one chunk on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
export const analyseCodeAndDetectChunkMetadataOfFiles = async (
  filesMetadata,
  programConfiguration
) => {
  const entryFile = resolveAddressWithProvidedDirectory(
    process.cwd(),
    programConfiguration.moduleToCheck
  );
  setImportedFilesMapping([entryFile], filesMetadata, {
    checkStaticImportsOnly: true,
    checkForFileSize: true,
  });
  process.send({
    text: ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE,
    messageType: DISPLAY_TEXT,
  });
  const givenFileDependencySet = getAllDependentFiles(entryFile, filesMetadata);
  process.send({
    text: IDENTIFICATION_OF_GIVEN_FILE_CHUNK_METADATA_MESSAGE,
    messageType: DISPLAY_TEXT,
  });
  process.send({
    filesArray: Array.from(givenFileDependencySet),
    cacheMapping,
    entryFile,
    messageType: CHECK_CHUNKS_METADATA_USING_GIVEN_FILE,
  });
};
