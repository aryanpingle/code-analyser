module.exports = {
  intraModuleDependencies: {
    check: false, // True or false
    entry: [/\.[jt]s/i], // Regex or can be absolute/relative file path
    moduleToCheck: "../myntra-clone/src/Components/", // module to check for intradependency 
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]sx$/i],
    // entry: ["./index.js"]
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  directoriesToCheck: ["../react-typescript-samples/old_class_components_samples/13 TestComponents/"],
  // directoriesToCheck: ["./"],
};
