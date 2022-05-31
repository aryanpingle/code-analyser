const { checkUsingEntryFile } = require("../checker/entry-file-checker");
const { getAllEntryFiles, getAllFilesToCheck } = require("./files");
const { addNewInstanceToSpinner, updateSpinnerInstance } = require("./cli");
const { buildIntraModuleDependencyRegex } = require("./regex");
const { getDefaultFileObject } = require("../ast/utility");
const fs = require("fs");
const analyseCode = (allEntryFiles, filesMetadata, spinner) => {
  addNewInstanceToSpinner(spinner, "id3", "Analysing codebase...");
  allEntryFiles.forEach((entryFile) =>
    checkUsingEntryFile(entryFile, filesMetadata)
  );
  updateSpinnerInstance(spinner, "id3", {
    text: "Analysed code base",
    status: "succeed",
  });
};

const getDeadFiles = (allFilesToCheck, filesMetadata, spinner) => {
  addNewInstanceToSpinner(
    spinner,
    "id4",
    "Identifying all deadfiles inside the directories to check..."
  );
  const allDeadFiles = allFilesToCheck.filter((file) => {
    return (
      (filesMetadata.filesMapping[file] &&
        filesMetadata.filesMapping[file].isEntryFile === false &&
        filesMetadata.filesMapping[file].referencedCount ===
          filesMetadata.filesMapping[file].importReferenceCount) ||
      !filesMetadata.filesMapping[file]
    );
  });
  if (filesMetadata.unparsableVistedFiles === 0)
    updateSpinnerInstance(spinner, "id4", {
      text: "Successfully identified all dead files",
      status: "succeed",
    });
  else {
    updateSpinnerInstance(spinner, "id4", {
      text: "Unable to identify few dead files",
      color: "yellow",
      status: "stopped",
    });
  }
  return allDeadFiles;
};
const updateFileWebpackChunk = async (filesMetadata) => {
  const filesMapping = filesMetadata.filesMapping;
  const folders = [];
  for (const file in filesMapping) {
    if (filesMapping[file].type === "FOLDER") {
      folders.push(filesMapping[file]);
    }
  }
  for (const index in folders) {
    const folder = folders[index];
    const folderName = folder.fileLocation;
    const folderWebpackConfiguration = folder.webpackChunkConfiguration;
    const allFilesToCheck = await getAllFilesToCheck(
      [folderName],
      filesMetadata.excludedPointsRegex
    );
    allFilesToCheck.forEach((file) => {
      if (
        folderWebpackConfiguration.webpackInclude.test(file) &&
        !folderWebpackConfiguration.webpackExclude.test(file)
      ) {
        if (!filesMapping[file])
          filesMapping[file] = getDefaultFileObject(file);
        filesMapping[file].webpackChunkConfiguration =
          folder.webpackChunkConfiguration;
      }
    });
  }
};
const getIntraModuleDependencies = (
  filesMetadata,
  moduleLocation,
  spinner
) => {
  addNewInstanceToSpinner(
    spinner,
    "id5",
    "Identifying intra-module dependencies..."
  );
  const intraModuleDependencyRegex =
    buildIntraModuleDependencyRegex(moduleLocation);
  const excludedPointsRegex = filesMetadata.excludedPointsRegex;

  const intraModuleImports = [];
  const filesMapping = filesMetadata.filesMapping;
  const moduleChunkName = getWebChunkName(moduleLocation, filesMetadata);
  // console.log(filesMapping)
  for (const file in filesMapping) {
    if (
      intraModuleDependencyRegex.test(file) &&
      fs.statSync(file).isFile() &&
      !excludedPointsRegex.test(file) &&
      isInSameWebpackChunk(file, moduleChunkName, filesMetadata)
    ) {
      intraModuleImports.push(file);
    }
  }
  if (filesMetadata.unparsableVistedFiles === 0)
    updateSpinnerInstance(spinner, "id5", {
      text: "Successfully identified all intra module dependencies",
      status: "succeed",
    });
  else {
    updateSpinnerInstance(spinner, "id5", {
      text: "Unable to identify few intra module dependencies",
      color: "yellow",
      status: "stopped",
    });
  }
  return intraModuleImports;
};

const getWebChunkName = (moduleLocation, filesMetadata) => {
  let chunkName = "default";
  const filesMapping = filesMetadata.filesMapping;
  for (const file in filesMapping) {
    const webpackChunkConfiguration =
      filesMapping[file].webpackChunkConfiguration;
    if (
      moduleLocation.startsWith(webpackChunkConfiguration.webpackPath) &&
      (fs.statSync(moduleLocation).isDirectory() ||
        (webpackChunkConfiguration.webpackInclude.test(moduleLocation) &&
          webpackChunkConfiguration.webpackInclude.test(moduleLocation)))
    ) {
      chunkName = webpackChunkConfiguration.webpackChunkName;
    }
  }
  return chunkName;
};
const isInSameWebpackChunk = (file, moduleChunkName, filesMetadata) => {
  return (
    filesMetadata.filesMapping[file].webpackChunkConfiguration
      .webpackChunkName === moduleChunkName
  );
};
const getAllRequiredFiles = async (config, excludedPointsRegex, spinner) => {
  addNewInstanceToSpinner(
    spinner,
    "id1",
    "Retrieving all files inside directories to check..."
  );
  const allFilesToCheck = await getAllFilesToCheck(
    config.directoriesToCheck,
    excludedPointsRegex
  );
  updateSpinnerInstance(spinner, "id1", {
    text: "Successfully retrieved all files inside the directories to check",
    status: "succeed",
  });
  addNewInstanceToSpinner(spinner, "id2", "Retrieving entry files...");
  const allEntryFiles = await getAllEntryFiles(
    config.entry,
    allFilesToCheck,
    excludedPointsRegex
  );
  updateSpinnerInstance(spinner, "id2", {
    text: "Successfully retrieved all entry files",
    status: "succeed",
  });

  return { allEntryFiles, allFilesToCheck };
};

module.exports = {
  analyseCode,
  getDeadFiles,
  getIntraModuleDependencies,
  getAllRequiredFiles,
  updateFileWebpackChunk
};
