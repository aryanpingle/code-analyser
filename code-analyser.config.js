module.exports = {
  intraModuleDependencies: {
    check: false, // True or false
    entry: [/\.[jt]sx?/i], // Regex or can be absolute/relative file path
    depth: 1, // Integer
    moduleToCheck: "../portfolio/src/pages/index.page.js", // module to check for intra-dependencies
  },
  deadFiles: {
    check: true,
    entry: [/index\.[jt]sx?$/i],
  },
  exclude: [/node_modules|(\.git)|(Icon)|jpg|png|hdr|svg|glb|woff2|mp4|mdx/], // Excluded files
  rootDirectory: "./",
  directoriesToCheck: ["../jira_clone/client/src"],
};
