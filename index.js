const {
  entry,
  exclude,
  directoriesToCheck,
} = require("./deadcode-remover.config.js");
const { checkUsingEntryFile } = require("./entry-file-checker");
const {
  getAllFiles,
  buildExcludedPointsRegex,
  buildIntraModuleDependencyRegex,
  directoryResolver,
} = require("./utility");

const excludedPointsRegex = buildExcludedPointsRegex(exclude);
const filesMetadata = {
  filesMapping: {},
  VisitedFilesMapping: {},
  excludedPointsRegex: excludedPointsRegex,
};
const visitedDirectoriesToCheckMapping = {};
const visitedEntryDirectoriesMapping = {};
const checkIntraModuleDependencies = Array.isArray(entry)
  ? false
  : entry.checkIntraModuleDependencies;

const getAllEntryFiles = async () => {
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

const getAllFilesToCheck = async () => {
  return await getAllFiles(
    directoriesToCheck,
    visitedDirectoriesToCheckMapping,
    excludedPointsRegex
  );
};

const getDeadFiles = async () => {
  const allEntryFiles = await getAllEntryFiles(),
    allFilesToCheck = await getAllFilesToCheck();
  allEntryFiles.forEach((entryFile) =>
    checkUsingEntryFile(entryFile, filesMetadata)
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
  console.log(allDeadFiles);

  if (checkIntraModuleDependencies)
    console.log(
      getIntraModuleDependencies(
        filesMetadata,
        directoryResolver(__dirname, entry.source)
      )
    );
};

const getIntraModuleDependencies = (filesMetadata, moduleLocation) => {
  const intraModuleDependencyRegex =
    buildIntraModuleDependencyRegex(moduleLocation);
  const intraModuleImports = [];
  for (const file in filesMetadata.filesMapping) {
    if (
      intraModuleDependencyRegex.test(file) &&
      !excludedPointsRegex.test(file)
    )
      intraModuleImports.push(file);
  }
  return intraModuleImports;
};
getDeadFiles();
