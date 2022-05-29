const {
  entry,
  exclude,
  directoriesToCheck,
} = require("./deadcode-remover.config.js");
const {
  buildExcludedPointsRegex,
  buildIntraModuleDependencyRegex,
} = require("./utility/regex");
const { checkUsingEntryFile } = require("./checker/entry-file-checker");
const { getAllFiles } = require("./utility/filesfinder");
const { directoryResolver } = require("./utility/resolver");
const spinnies = require("spinnies");

const excludedPointsRegex = buildExcludedPointsRegex(exclude);
const filesMetadata = {
  filesMapping: {},
  visitedFilesMapping: {},
  excludedPointsRegex: excludedPointsRegex,
  unparsableVistedFiles: 0,
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
  const dots = {
    interval: 50,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  };
  const spinner = new spinnies({ spinner: dots });
  spinner.add("spinner-1", { text: "Retrieving entry files..." });
  const allEntryFiles = await getAllEntryFiles();
  spinner.succeed("spinner-1", {
    text: "Successfully retrieved all entry files",
  });
  spinner.add("spinner-2", {
    text: "Retrieving all files inside directories to check...",
  });
  const allFilesToCheck = await getAllFilesToCheck();
  spinner.succeed("spinner-2", {
    text: "Successfully retrieved all files inside the directories to check",
  });
  spinner.add("spinner-3", {
    text: "Identifying all deadfiles inside the directories to check...",
  });
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
  if (filesMetadata.unparsableVistedFiles === 0)
    spinner.succeed("spinner-3", {
      text: "Successfully identified all dead files",
    });
  else {
    spinner.update("spinner-3", {
      text: "Unable to identify few dead files",
      color: "yellow",
      status: "stopped",
    });
  }
  console.log(allDeadFiles);

  if (checkIntraModuleDependencies) {
    spinner.add("spinner-4", {
      text: "Identifying intra-module dependencies...",
    });
    const intraModuleDependencies = getIntraModuleDependencies(
      filesMetadata,
      directoryResolver(__dirname, entry.source)
    );
    if (filesMetadata.unparsableVistedFiles === 0)
      spinner.succeed("spinner-4", {
        text: "Successfully identified all intra module dependencies",
      });
    else {
      spinner.update("spinner-4", {
        text: "Unable to identify few intra module dependencies",
        color: "yellow",
        status: "stopped",
      });
    }

    console.log(intraModuleDependencies);
  }
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
