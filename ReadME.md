<h2 align="center">Code Analyser</h2>
<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/kylelobo/The-Documentation-Compendium.svg)](https://github.com/Daksh2104/code-analyser/pulls)

  </div>

# Table of Contents

- [Overview](#overview)
- [Resilient features](#some-resilient-features)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Sample Examples](#sample-examples)
- [Major Technologies Used](#major-technologies-used)
- [Design Patterns](#design-patterns)
- [Author](#author)

# Overview

Code-Analyser is a script which contains many features, which allow easier analysis of a project. Some of the aspects of the code which can be analysed are:-

- **Find dead files inside a project**\
  As the code size increases, it becomes difficult for developers to keep track of dead files inside a project. This may lead to increase in bundle/ chunk size, memory usage, load time. This also increases inconsistencies present inside a codebase. The biggest problem is to check for each file individually where it has been imported somewhere else or not. Using this script, one can perform static testing on the code to check whether there exists dead files inside the codebase or not.
- **Find dependencies at a given depth from a module**\
  Statically importing a file increases the size of the chunk inside which the file which imports that file is present. This will not only import that file, but also all it's static dependencies. This becomes a cumbersome job for a developer to keep track of dependencies which are imported from some other module, also it becomes difficult to check all the places where these dependencies are being used. Using this script, one can find dependencies with respect to given entry files. They can also set depth, allowing the level at which these dependencies should be checked. By default, it will return the dependencies which follow the depth criteria and won't recursively check inside them . But if we want to recursively traverse these dependencies too, then we can do that too.
- **Find files which are present inside more than one chunk**\
  There can occur cases where a given file is imported by more than one file statically. Thus, the given file, along with it's dependencies, will be present inside all the chunks associated with the files which import it. Thus it increases the duplicity of the code as the same code is present inside more than one chunk. It becomes quite difficult to keep track of these file manually. Using this script, one can easily find all the files which are present inside more than one chunk. Not only that, it will also report the chunks inside which it is present to easily analyse and remove duplication.
- **Find the size and all the files which will be present inside a chunk if we create it using a given file**\
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

Install code-analyser CLI with any one of the following commands:-

```
$ npm install -g code-analyser
```

```
$ yarn global add code-analyser
```

# Usage

```
$ analyseCode <options>
```

# Options

| Name                                     | Type    | Default | Description                                                                                                                                                                                                                                                                                                                                         | Example                                    |
| ---------------------------------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `checkAll`                               | Boolean | false   | Used with `checkDependenciesAtGivenDepth` to get all the dependencies or only the first dependency files which satisfy the depth criteria. By default will provide the first dependencies which satisfy the depth criteria. Setting it as true, will allow recursive check for dependencies inside a dependency which satisfies the depth criteria. | `--checkAll`                               |
| `checkChunkMetadataUsingGivenChunk`      | Boolean | false   | Set it as true if need to find uncompressed chunk size and all files which will be present inside the chunk, if the user creates a new chunk using a given file                                                                                                                                                                                     | `--checkChunkMetadataUsingGivenChunk`      |
| `checkDeadFiles`                         | Boolean | false   | Set it as true if dead files check is required                                                                                                                                                                                                                                                                                                      | `--checkDeadFiles`                         |
| `checkDependenciesAtGivenDepth`          | Boolean | false   | Set it as true if dependencies at a given depth check is required                                                                                                                                                                                                                                                                                   | `--checkDependenciesAtGivenDepth`          |
| `checkFilesContributingInMultipleChunks` | Boolean | false   | Set it as true if files present in multiple chunks check is required                                                                                                                                                                                                                                                                                |`--checkFilesContributingInMultipleChunks`|
| `depth`                                  | Integer | 1       | Provide the level at which dependencies should be checked. Eg. if `moduleToCheck` = A/B/C/D/E and depth = 2 from back, then it will check for dependencies which are not of the form A/B/C/D/\*                                                                                                                                                     |`--depth=5`|
| `directoriesToCheck`                     | Array   |         | Used along with `checkDeadFiles`, and `checkFilesContributingInMultipleChunks` options to provide directories from which entry files (if regex provided as an entry element) or files to check (in case of dead files check only) will be retrieved. Will accept an Array consisting of relative/ absolute paths                                    | `--directoriesToCheck="['./src']"`         |
| `entry`                                  | Array   |         | Use it to provide entry files by providing an array consisting of Regex, relative or absolute paths                                                                                                                                                                                                                                                 | `--entry='["./index.js", /main\.js/]'`     |
| `exclude`                                | Array   |         | Use it to exclude some files in the directory from being checked. It will exclude all test files, images, videos, node modules by default. Will accept an array consiting of Regex, relative or absolute paths                                                                                                                                      | `--exclude='["./common", /\.css/]'`        |
| `include`                                | Array   |         | Use it to provide the directories which can be checked if needed. For eg. Will ignore a file's dependency if it isn't present inside a directory provided in the `include` field. This will include all the files provided using the `directoriesToCheck` field (if present) by default. Will accept an array consiting of relative/ absolute paths | `--include='["./src", "./public"]'`        |
| `interact`                               | Boolean | false   | Use it to display the output in an interactive way for better analysis. Will be always true when using `checkChunkMetadataUsingGivenChunk` option                                                                                                                                                                                                   | `--interact`                               |
| `isDepthFromFront`                       | Boolean | false   | Used to decide whether the depth has to be checked from front or back. By default, will check depth from back.                                                                                                                                                                                                                                      | `--isDepthFromFront`                       |
| `moduleToCheck`                          | String  |         | Used along with `checkDependenciesAtGivenDepth`, and `checkChunkMetadataUsingGivenChunk` to provide the module using which either dependencies at given depth or chunk metadata has to be computed. Will accept a string which denotes the absolute/ relative path of the module                                                                    | `--moduleToCheck="./src/index.js"`         |
| `rootDirectory`                          | String  |         | Use it if extra path resolution required. Will check for `tsconfig.json` or `jsconfig.json` to provide access to use special paths. Will accept a string denoting the absolute/ relative path of the module                                                                                                                                        | `--rootDirectory='./'`                     |
| `totalFilesToShow`                       | Integer | All     | Used with `checkChunkMetadataUsingGivenChunk` to provide the maximum number of files present inside that chunk to report back to the user. Will show the files which contributes the most in chunk size. By default, will report all the files present inside that chunk.                                                                   | `--totalFilesToShow=25`                    |

# Sample Examples

```
$ analyseCode --checkDeadFiles --entry='["./index.js"]' --directoriesToCheck='["./"]' --rootDirectory='./'
```

```
$ analyseCode --checkFilesContributingInMultipleChunks --entry='["./src/index.tsx"]' --exclude='["./src/common"]' --interact
```

```
$ analyseCode --checkDependenciesAtGivenDepth --exclude='["./public"]' --moduleToCheck="./index.jsx" --depth=2 --isDepthFromFront=true --checkAll --interact
```

```
$ analyseCode --checkChunkMetadataUsingGivenChunk --moduleToCheck="[/index\.jsx/]" --totalFilesToShow=50
```

# Major Technologies Used

- Vanilla JavaScript: Lightweight JS Framework
- Babel Parser: JavaScript Parser
- Babel Traverse: AST traverser
- Babel generator: AST to Code convertor
- Enhanced–Resolve: Path Resolver
- Enquirer: Interactive CLI builder

# Design Patterns

- Factory Method: Creational Pattern
- Composite: Structural Pattern

# Author

[Daksh Sharma](https://github.com/Daksh2104)
