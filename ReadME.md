Code-Analyser is a script which can be used to find out deadfiles present in the program. It can also be used to find out intra-module dependencies.
It contains a `code-analyser.config.js` file where a person has to be provide details related to intra-module dependencies and deadfile checkers.
<br>

>

    code-analyser.config.js format
    module.exports = {
        intraModuleDependencies: {
            check: Boolean
            entry: [String or Regex]
            isDepthFromFront: Boolean
            depth: Integer
            moduleToCheck: String
        },
        deadFiles: {
            check: Boolean,
            entry: [String or Regex]
            directoriesToCheck: [String]
        },
        exclude: [String or Regex],
        rootDirectory: String
    }

>

**_code-analyser.config.js description_**

- If someone wants to use a particular checker, then set it's `check` as true.
- One can provide entry files to check using `entry` key. The accepted value is an array consisiting of Regex, relative paths, or absolute paths.
- To exclude some files in the directory from check, use `exclude` field. It also accepts an array consisting of Regex, relative paths or absolute paths.
- `directoriesToCheck` will be used to provide from which directories an entry file to get
- `rootDirectory` will be provided by the user if extra resolution is required (If the user is using tsconfig.json or jsconfig.json files to provide special paths).
- Inside `intraModuleDependency`, one can provide the module for which we are checking the intra-module dependencies in `moduleToCheck` field. Accepts a string representing a module's relative or absolute path.
- Use `depth` to change the level where intra-module dependencies have to be checked from.
- Use `isDepthFromFront` to decide whether the depth should be calculated from front or back.
- For Eg. entry: A/B/C/D and depth: 3 and isDepthFromFront: false, then program will return intra-module dependencies of form A/_ and not of the form A/B/_

  **_Steps to run the program:_**

  >        1.  Set the required entries inside code-analyser.config.js file
  >        2.  Go into the program's directory using terminal
  >        3.  Run npm install
  >        4.  Run npm run script
  >        5.  Output will be shown on the console
