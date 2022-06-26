Code-Analyser is a script which contains many features, which allow easier analysis of a project. Some of the aspects of the code which can be analysed are:-

- **Find dead files inside a project**\
  As the code size increases, it becomes difficult for developers to keep track of dead files inside a project. This may lead to increase in bundle/ chunk size, memory usage, load time. This also increases inconsistencies present inside a codebase. The biggest problem is to check for each file individually where it has been imported somewhere else or not. Using this script, one can perform static testing on the code to check whether there exists dead files inside the codebase or not.
- **Find dependencies at a given depth from a module**\
  Statically importing a file increases the size of the chunk inside which the file which imports that file is present. This will not only import that file, but also all it's static dependencies. This becomes a cumbersome job for a developer to keep track of dependencies which are imported from some other module, also it becomes difficult to check all the places where these dependencies are being used. Using this script, one can find dependencies with respect to given entry files. They can also set depth, allowing the level at which these dependencies should be checked. By default, it will return the first files which are feasible dependencies. But if we want to recursive traverse these feasible dependencies too, then we can do that too.
- **Find files which are present in more than one chunk**\
  There can occur cases where a given file is imported by more than one file statically. Thus, the given file, along with it's dependencies, will be present inside all the chunks associated with the files which import it. Thus it increases the duplicity of the code as the same code is present in more than one chunk. It becomes quite difficult to keep track of these file manually. Using this script, one can easily find all the files which are present in more than one chunk. Not only that, it will also report the chunks inside which it is present to easily analyse and remove duplication.
- **Find all dependency files and size of the chunk if the chunk is created using a given file**\
   Whenever someone wants to create a new chunk using a given file as the entry file for that chunk, then it becomes difficult for them to keep track of all the files which will be present inside that chunk. Not only that, it is also difficult to get an idea related to bottlenecks inside the chunk. For example, there can be some specific files which may be increasing the total size of the chunk. One can use this script to find out all the files which will be present inside the chunk, if we build that chunk using the provided file as the entry file. It also provides other information like the total uncompressed chunk size, and contribution of each file in increasing the chunk size.
  <br>

# Some Resilient features:-

- Easy to use
- Support for CommonJs, ES6, TypeScript, and JSX
- Allows multiple entry/ excluded files
- Handles cyclic dependencies
- Able to resolve special paths provided in configuration files
- Interactive CLI for better analysis

# Installation

Install code-analyser CLI with the following command:-

> npm install -g code-analyser
> <br>

# Usage and Examples

`analyseCode <options>`

# Options

### Feature to check options

- `checkDeadFiles` **(default: false)** \
   Set it as true if dead files check is required.
  Accepted values: True/ false
  <br>
- `checkDependenciesAtGivenDepth` **(default: false)** \
   Set it as true if dependencies at a given depth check is required. \
   Accepted values: True/ false
  <br>
- `checkDuplicateFiles` **(default: false)** \
   Set it as true if files present in multiple chunks check is required.\
   Accepted values: True/ false
  <br>
- `checkPossibleChunksMetadata` **(default: false)**\
   Set it as true if need to find uncompressed chunk size and all files which will be present inside the chunk, if user chunks using a given file. \
   Accepted values: True/ false

### Files to check options

- `entry` \
   One can provide entry files using it. \
   Accepted values: Array consisiting of Regex, relative paths, or absolute paths.
  <br>
- `include` \
   Can be used to provide the directories which can be checked if needed. \
   For eg. Will ignore a file's dependency if it isn't present inside a directory provided in the `include` field \
  This will include all the files provided using the `directoriesToCheck` field (if present) by default. \
  Accepted values: Array consisting of relative paths, or absolute paths.
  <br>
- `exclude`
  Use it to exclude some files in the directory from being checked. \
   It will exclude all test files, images, videos, node modules by default. \
   Accepted values: Array consisting of Regex, relative/ absolute paths.
  <br>
- `directoriesToCheck` \
   Used along with `checkDeadFiles`, `checkDuplicateFiles`, and `checkPossibleChunksMetadata` options to provide directories from which entry files (if regex provided as an entry element)/ files to check (in case of dead files check only) will be retrieved. \
   Accepted values: Array consisting of relative/ absolute paths
  <br>
- `moduleToCheck` \
   Use it to provide entry file/ directory using which dependencies at a given depth have to be retrieved. \
   Accepted values: Absolute/ relative path of the module

### Other options

- `interact` **(default: false)** \
   Use it to display the output in an interactive way for better analysis \
   Will be always true when using `checkPossibleChunksMetadata` option \
   Accepted values: True/ false
  <br>
- `rootDirectory` \
   Use it if extra path resolution required. Will check for `tsconfig.json` or `jsconfig.json` to provide access to use special paths. \
   Accepted values: Absolute/ relative path of the module
  <br>
- `depth` **(default: 1)** \
   Provide the level at which dependencies should be checked. \
   Eg. if entry file = A/B/C/D and depth = 1 from back, thn it will check for dependencies of the form A/B/C/_ and not of the form A/B/C/D \
   Eg. if entry file = A/B/C/D and depth = 2 from front, thn it will check for dependencies of the form A/_ and not of the form A/B/\* \
   Accepted values: Integer
  <br>
- `isDepthFromFront` **(default: false)** \
   Used to decide whether the depth has to be checked from front or back. \
   By default, will check depth from back. \
   Accepted values: True/ false
  <br>
- `checkAll` **(default: false)** \
   Used with dependencies at a given depth checker to get all the feasible dependencies or only the first feasible dependency files \
   By default will provide the first feasible dependencies. \
   Setting it as true, will allow recursive check for feasible dependencies inside a feasible dependency. \
  Accepted values: True/ false

# Sample Examples

- `analyseCode --checkDeadFiles --entry='["./index.js"]' --directoriesToCheck='["./"]' --rootDirectory='./'`
- `analyseCode --checkDuplicateFiles --entry='["./src/index.tsx"]' --interact`
- `analyseCode --checkDependenciesAtGivenDepth --exclude='["./public"]' --moduleToCheck="./index.jsx" --interact`
- `analyseCode --checkPossibleChunksMetadata --entry="[/index\.jsx/]" --directoriesToCheck='["./src"]'`
