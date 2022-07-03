import { codeAnalyserConfigurationObject } from "./utility/configuration.js";
import objectFactory from "./utility/factory.js";
import {
  isDeadFilesCheckRequired,
  isDependenciesAtGivenDepthCheckRequired,
  isFilesContributingInMultipleChunksCheckRequired,
  isMetadataOfGivenChunkCheckRequired,
} from "./utility/helper.js";
import {
  analyseCodeAndDetectDeadfiles,
  analyseCodeAndDetectDependenciesAtGivenDepth,
  analyseCodeAndDetectAllFilesPresentInMultipleChunks,
  analyseCodeAndDetectMetadataOfGivenChunk,
} from "./features/index.js";

const filesMetadata = objectFactory.createNewFilesMetadataObject(
  codeAnalyserConfigurationObject.exclude,
  codeAnalyserConfigurationObject.include
);
switch (true) {
  case isDeadFilesCheckRequired(codeAnalyserConfigurationObject):
    analyseCodeAndDetectDeadfiles(
      filesMetadata,
      codeAnalyserConfigurationObject
    );
    break;
  case isDependenciesAtGivenDepthCheckRequired(codeAnalyserConfigurationObject):
    analyseCodeAndDetectDependenciesAtGivenDepth(
      filesMetadata,
      codeAnalyserConfigurationObject
    );
    break;
  case isFilesContributingInMultipleChunksCheckRequired(
    codeAnalyserConfigurationObject
  ):
    analyseCodeAndDetectAllFilesPresentInMultipleChunks(
      filesMetadata,
      codeAnalyserConfigurationObject
    );
    break;
  case isMetadataOfGivenChunkCheckRequired(codeAnalyserConfigurationObject):
    analyseCodeAndDetectMetadataOfGivenChunk(
      filesMetadata,
      codeAnalyserConfigurationObject
    );
    break;
}
