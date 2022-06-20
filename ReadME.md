Code-Analyser is a script which can be used to find out deadfiles present in the program. It can also be used to find out intra-module dependencies.
<br>

# Some Resilient features:-

- Easy to use
- Support for CommonJs, ES6, TypeScript, and JSX
- Allows multiple entry/ excluded files
- Handles cyclic dependencies
- Can find intra-module dependencies at any depth

# Installation

Install code-analyser Cli with the following command

> npm install -g code-analyser

# Usage and Examples

## Format

`analyseCode <options>`

### Options

- `checkDeadFiles` **(default: false)** \
   Set it as true if dead files check is required.
  Accepted values: True/ false
- `checkIntraModuleDependencies` **(default: false)** \
   Set it as true if intra-module dependencies check required. \
   Accepted values: True/ false
- `checkDuplicateFiles` **(default: false)** \
   Set it as true if files present in multiple chunks check is required.\
   Accepted values: True/ false
- `entry` \
   One can provide entry files using it. \
   Accepted values: Array consisiting of Regex, relative paths, or absolute paths.
- `include` \
   Can be used to provide the directories which can be checked if needed. \
   For eg. Will ignore a file's dependency if it isn't present inside a directory provided in the `include` field \
  This will include all the files provided using the `directoriesToCheck` field (if present). \
  Accepted values: Array consisting of relative paths, or absolute paths.
- `exclude` **(default: [ /node_modules/ ])** \
   Use it to exclude some files in the directory from being checked. By default will ignore node_modules. \
   Accepted values: Array consisting of Regex, relative/ absolute paths.
- `directoriesToCheck` \
   Used by deadfiles checker, and duplicate files checker which will be used to provide directories from which entry files (if regex provided as an entry element)/ files to check will be retrieved (in case of dead files check only). \
   Accepted values: Array consisting of relative/ absolute paths
- `rootDirectory` \
   Use it if extra path resolution required. Will check for `tsconfig.json` or `jsconfig.json` to provide access to use special paths. \
   Accepted values: Absolute/ relative path of the module
- `moduleToCheck` \
   Use it to provide entry file/ directory using which intra-module dependencies have to be retrieved. \
   Accepted values: Absolute/ relative path of the module
- `depth` **(default: 1)** \
   Provide the level at which intra-module dependencies should be checked. \
   Eg. if entry file = A/B/C/D and depth = 1 from back, thn it will check for dependencies of the form A/B/C/_ and not of the form A/B/C/D \
   Eg. if entry file = A/B/C/D and depth = 2 from front, thn it will check for dependencies of the form A/_ and not of the form A/B/\* \
   Accepted values: Integer
- `isDepthFromFront` **(default: false)** \
   Used to decide whether the depth has to be checked from front or back. \
   Accepted values: True/ false

### Sample Examples

> analyseCode --checkDeadFiles --entry='["./index.js"]' --directoriesToCheck='["./"]' --rootDirectory='./'

> analyseCode --checkDuplicateFiles --entry='["./src/index.tsx"]'

> analyseCode --checkIntraModuleDependencies --exclude='[/node_modules|(\.git)|(Icon)|jpg|png|hdr|svg|glb|woff2|mp4|mdx|webp/]' --moduleToCheck="./index.jsx"
