module.exports = {
  intraModuleDependencies: {
    check: true, // True or false
    entry: [/\.[jt]s/i], // Regex or can be absolute/relative file path
    moduleToCheck: "./index.js", // module to check for intradependency 
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]s/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  directoriesToCheck: ["./"],
};
