Code-Analyser is a script which can be used to find out deadfiles present in the program. It can also be used to find out intra-module dependencies. 
It contains a code-analyser.config.js file where a person has to be provide details related to intra-module dependencies and deadfile checkers. 
<br>
    
>
    code-analyser.config.js format

    module.exports = {
        intraModuleDependencies: {
            check: Boolean
            entry: [String or Regex]
            moduleToCheck: String
        },
        deadFiles: {
            check: Boolean,
            entry: [String or Regex]
        },
        exclude: [String or Regex],
        directoriesToCheck: [String]
    }
<br>

> 
***code-analyser.config.js description***
- If someone wants to use a particular checker, then set it's "check" as true. <br>
- One can provide entry files to check using "entry" key. The accepted value is an array consisiting of Regex, relative paths, or absolute paths. <br>
- To exclude some files in the directory from check, use "exclude" field. It also accepts an array consisting of Regex, relative paths or absolute paths. <br>
- DirectoriesToCheck can be used to specify which directories should be checked and hence if a file is not inside a directory present inside DirectoriesToCheck, then it won't be reported even if it is a deadfile or intra-module dependency. It accepts an array of relative or absolute paths. <br>
- Inside intraModuleDependency, one can provide the module for which we are checking the intra-module dependencies in "moduleToCheck" field. Accepts a string representing a module's relative or absolute path. <br>
<br>
>
> Steps to run the program: <br>
    1.  Set the required entries inside code-analyser.config.js file<br>
    2.  Go into the program's location on terminal.<br>
    3.  Run ``npm install``<br>
    4.  Run ``npm run script``<br>
    5.  Output will be shown on the console.

