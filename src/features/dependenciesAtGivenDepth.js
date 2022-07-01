import { codeAnalyerConfigurationObject } from "../utility/configuration.js";
import {
  CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
  DEFAULT_TRUE_REGEX_STRING,
} from "../utility/constants.js";
import {
  getAllRequiredFiles,
  getDependenciesAtGivenDepth,
  getDependenciesAtGivenDepthUsageMapping,
  setImportedFilesMapping,
} from "../utility/featureSpecificOperations/index.js";
import { buildDependenciesAtGivenDepthRegex } from "../utility/regex.js";
import { resolveAddressWithProvidedDirectory } from "../utility/resolver.js";

/**
 * Function which first analyses the code and prints the dependencies at a given depth on the console
 * @param {Object} filesMetadata Object which contains information related to all files parsed
 * @param {Object} programConfiguration Object which contains information related to which files have to be checked
 */
export const analyseCodeAndDetectDependenciesAtGivenDepth = async (
  filesMetadata,
  programConfiguration
) => {
  const excludedFilesRegex = filesMetadata.excludedFilesRegex;
  const { allEntryFiles } = await getAllRequiredFiles(
    {
      directoriesToCheck: [programConfiguration.moduleToCheck],
      entry: programConfiguration.entry,
    },
    excludedFilesRegex
  );
  const dependencyCheckerRelatedMetadata = {
    moduleLocation: resolveAddressWithProvidedDirectory(
      process.cwd(),
      programConfiguration.moduleToCheck
    ),
    isDepthFromFront: programConfiguration.isDepthFromFront,
    depth: programConfiguration.depth,
  };
  const { outsideModuleCheckRegex, insideModuleCheckRegex } =
    buildDependenciesAtGivenDepthRegex(
      dependencyCheckerRelatedMetadata.moduleLocation,
      dependencyCheckerRelatedMetadata.isDepthFromFront,
      dependencyCheckerRelatedMetadata.depth
    );
  filesMetadata.insideModuleCheckRegex = codeAnalyerConfigurationObject.checkAll
    ? new RegExp(DEFAULT_TRUE_REGEX_STRING)
    : insideModuleCheckRegex;
  setImportedFilesMapping(allEntryFiles, filesMetadata, {
    checkStaticImportsOnly: true,
  });

  const dependenciesAtGivenDepth = getDependenciesAtGivenDepth(
    outsideModuleCheckRegex,
    filesMetadata
  );

  const filesLengthObject = {
    dependenciesAtGivenDepth: dependenciesAtGivenDepth.length,
    entryFiles: allEntryFiles.length,
  };

  const dependenciesUsageMapping = codeAnalyerConfigurationObject.interact
    ? getDependenciesAtGivenDepthUsageMapping(
        dependenciesAtGivenDepth,
        filesMetadata
      )
    : null;

  process.send({
    filesMetadata,
    filesLengthObject,
    filesArray: dependenciesAtGivenDepth,
    filesUsageMapping: dependenciesUsageMapping,
    messageType: CHECK_DEPENDENCIES_AT_GIVEN_DEPTH,
    interact: codeAnalyerConfigurationObject.interact,
  });
};
