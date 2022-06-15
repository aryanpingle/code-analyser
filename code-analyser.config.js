module.exports = {
  intraModuleDependencies: {
    check: false, // True or false
    entry: [/\.[jt]sx?/i], // Regex or can be absolute/relative file path
    isDepthFromFront: false, // True or false
    depth: 1, // Integer
    moduleToCheck: "../react-typescript-netflix-clone/src/index.tsx", // module to check for intra-dependencies
  },
  deadFiles: {
    check: true,
    entry: ["../takenote/src/client/index.tsx"],
    directoriesToCheck: ["../takenote/src/"],
    // entry: ["../react-typescript-netflix-clone/src/index.tsx"]
  },
  exclude: [/node_modules|(\.git)|(Icon)|jpg|png|hdr|svg|glb|woff2|mp4|mdx|webp|cores/, "../takenote/src/server" ], // Excluded files
  rootDirectory: "../takenote/",
};
