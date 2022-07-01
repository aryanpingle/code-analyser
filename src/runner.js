import { codeAnalyerConfigurationObject } from "./utility/configuration.js";
import objectFactory from "./utility/factory.js";
import {
  isDeadfileCheckRequired,
  isDependenciesCheckRequiredAtGivenDepthCheckRequired,
  isFilesContributingInMultipleChunksCheckRequired,
  isMetadataOfGivenChunkCheckRequired,
} from "./utility/helper.js";
import {
  analyseCodeAndDetectDeadfiles,
  analyseCodeAndDetectDependenciesAtGivenDepth,
  analyseCodeAndDetectAllFilesPresetInMultipleChunks,
  analyseCodeAndDetectChunkMetadataOfFiles,
} from "./features/index.js";

const filesMetadata = objectFactory.createNewFilesMetadataObject(
  codeAnalyerConfigurationObject.exclude,
  codeAnalyerConfigurationObject.include
);
switch (true) {
  case isDeadfileCheckRequired(codeAnalyerConfigurationObject):
    analyseCodeAndDetectDeadfiles(
      filesMetadata,
      codeAnalyerConfigurationObject
    );
    break;
  case isDependenciesCheckRequiredAtGivenDepthCheckRequired(
    codeAnalyerConfigurationObject
  ):
    analyseCodeAndDetectDependenciesAtGivenDepth(
      filesMetadata,
      codeAnalyerConfigurationObject
    );
    break;
  case isFilesContributingInMultipleChunksCheckRequired(
    codeAnalyerConfigurationObject
  ):
    analyseCodeAndDetectAllFilesPresetInMultipleChunks(
      filesMetadata,
      codeAnalyerConfigurationObject
    );
    break;
  case isMetadataOfGivenChunkCheckRequired(codeAnalyerConfigurationObject):
    analyseCodeAndDetectChunkMetadataOfFiles(
      filesMetadata,
      codeAnalyerConfigurationObject
    );
    break;
}
