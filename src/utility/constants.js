module.exports = {
  CHECK_DEPENDENCIES_AT_GIVEN_DEPTH: "CHECK_DEPENDENCIES_AT_GIVEN_DEPTH",
  CHECK_DEAD_FILES: "CHECK_DEAD_FILES",
  CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS:
    "CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS",
  CHECK_CHUNKS_METADATA_USING_GIVEN_FILE:
    "CHECK_CHUNKS_METADATA_USING_GIVEN_FILE",
  DISPLAY_TEXT: "DISPLAY_TEXT",

  MESSAGE: "message",
  ERROR: "error",
  RUNNER_FILE: "runner.js",
  SIGINT: "SIGINT",

  GREEN_COLOR: "\x1b[32m",
  YELLOW_COLOR: "\x1b[33m",
  CLEAR: "\033c",
  BOLD: "\x1b[1m",

  CHECK_ALL_IMPORTS_ADDRESSES: "CHECK_ALL_IMPORTS_ADDRESSES",
  CHECK_STATIC_IMPORTS_ADDRESSES: "CHECK_STATIC_IMPORTS_ADDRESSES",
  CHECK_IMPORTS: "CHECK_IMPORTS",
  CHECK_USAGE: "CHECK_USAGE",
  CHECK_EXPORTS: "CHECK_EXPORTS",

  ALL_EXPORTS_AS_OBJECT: "ALL_EXPORTS_AS_OBJECT",
  ALL_EXPORTS_IMPORTED: "ALL_EXPORTS_IMPORTED",
  INDIVIDUAL_IMPORT: "INDIVIDUAL_IMPORT",

  DEFAULT_OBJECT_EXPORT: "DEFAULT_OBJECT_EXPORT",
  NORMAL_EXPORT: "NORMAL_EXPORT",

  UPDATE_REFERENCE_COUNT: "UPDATE_REFERENCE_COUNT",
  DONT_UPDATE_REFERENCE_COUNT: "DONT_UPDATE_REFERENCE_COUNT",

  JSCONFIG_FILE: "jsconfig.json",
  TSCONFIG_FILE: "tsconfig.json",

  IMPORT_SPECIFIER: "ImportSpecifier",
  IMPORT_DEFAULT_SPECIFIER: "ImportDefaultSpecifier",
  EXPORT_SPECIFIER: "ExportSpecifier",
  EXPORT_NAMESPACE_SPECIFIER: "ExportNamespaceSpecifier",

  FILE: "FILE",
  UNRESOLVED_TYPE: "UNRESOLVED TYPE",
  INBUILT_NODE_MODULE: "INBUILT_NODE_MODULE",

  OBJECT_PATTERN: "ObjectPattern",
  IDENTIFIER: "Identifier",
  TS_QUALIFIED_NAME: "TSQualifiedName",
  OBJECT_PROPERTY: "ObjectProperty",
  CALL_EXPRESSION: "CallExpression",
  AWAIT_EXPRESSION: "AwaitExpression",
  STRING_LITERAL: "StringLiteral",
  TEMPLATE_LITERAL: "TemplateLiteral",
  MEMBER_EXPRESSION: "MemberExpression",
  OBJECT_EXPRESSION: "ObjectExpression",

  DEFAULT: "default",
  NAMED_EXPORT: "namedExport",
  ALL_EXPORTED: "allExported",

  LEFT: "left",
  RIGHT: "right",
  NONE: "NONE",
  CHUNKS: "chunks",
  NUMBER: "number",
  BOOLEAN: "boolean",
  TRUE: "true",
  WEBPACK_CHUNK_NAME: "webpackChunkName",
  EMPTY_STRING: "",
  SPACE: " ",
  GO_BACK: "Go Back",

  OBJECT: "object",
  PROPERTY: "property",
  IMPORT: "Import",
  THEN: "then",
  REQUIRE: "require",
  MODULE: "module",
  EXPORTS: "exports",

  DEFAULT_ENTRY_ARRAY: [/.[jt]sx?$/],
  DEFAULT_REGEX_STRING: "!^()",
  DEFAULT_TRUE_REGEX_STRING: "^()",
  IGNORED_FILES_REGEX:
    /(\.git)|(\.spec\.(.*))|(\.mock\.(.*))|(\.fixtures?\.(.*))|(\.test\.(.*))|\.json$|\.md$|\.jpe?g$|\.png$|\.woff2$|\.hdr$|\.mp[0-9]$|\.svg$|\.glb$|\.mdx$|\.webp$|\.jade$|\.coffee$|\.styl$|\.story\.(.*)|\.babelrc$|\.env$|\.config\.(.*)/,
  IGNORED_FOLDERS_REGEX:
    /node_modules|__spec__|__mocks?__|__tests?__|__fixtures?__|\/spec\/|\/tests?\/|\/mocks?\/|\/fixtures?\/|__generated__|storybook|stories/,

  VALID_EXTENSIONS_ARRAY: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
  DEFAULT_MODULES_ARRAY: ["src", "node_modules"],
  SIZES_ARRAY: ["B", "KB", "MB", "GB", "TB", "PB"],

  SUCCESSFUL_RETRIEVAL_OF_ALL_FILES_MESSAGE:
    "Successfully retrieved all files inside the directories to check",
  SUCCESSFUL_RETRIEVAL_OF_ALL_ENTRY_FILES_MESSAGE:
    "Successfully retrieved all entry files",
  ANALYSED_CODEBASE_MESSAGE: "Analysed the codebase",
  SUCCESSFUL_IDENTIFICATION_OF_DEAD_FILES_MESSAGE:
    "Successfully identified all dead files",
  UNSUCCESSFUL_IDENTIFICATION_OF_DEAD_FILES_MESSAGE:
    "Unable to identify few dead files",
  SUCCESSFUL_IDENTIFICATION_OF_ALL_DEPENDENCIES_AT_GIVEN_DEPTH_MESSAGE:
    "Successfully identified all dependencies at the provided depth",
  UNSUCCESSFUL_IDENTIFICATION_OF_ALL_DEPENDENCIES_AT_GIVEN_DEPTH_MESSAGE:
    "Unable to identify few dependencies at the provided depth",
  ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE:
    "Established relationship between different files",
  IDENTIFICATION_OF_GIVEN_FILE_CHUNK_METADATA_MESSAGE:
    "Identified all the files along with their effective size which are present inside the chunk",
};
