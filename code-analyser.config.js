module.exports = {
  intraModuleDependencies: {
    check: false, // True or false
    entry: [/\.[jt]sx?/i], // Regex or can be absolute/relative file path
    depth: 2, // Integer
    moduleToCheck:
    "../React-TypeScript-Netflix-Clone/src/compounds/FooterCompound.tsx", // module to check for intra-dependencies
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]sx?$/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)/], // Excluded files
  rootDirectory: "./",
  directoriesToCheck: [
    "../react-typescript-example/src",
  ],
};
