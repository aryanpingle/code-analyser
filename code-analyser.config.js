module.exports = {
  intraModuleDependencies: {
    check: false, // True or false
    entry: [/\.[jt]s/i], // Regex or can be absolute/relative file path
    moduleToCheck:
      "../react-typescript-samples/old_class_components_samples/16 Custom Middleware/src/index.ts", // module to check for intradependency
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]s$/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  // directoriesToCheck: [
  //   "../react-typescript-samples/old_class_components_samples/19 LoginForm/",
  // ],
  directoriesToCheck: ["./"],
};
