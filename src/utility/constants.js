export const CHECK_DEPENDENCIES_AT_GIVEN_DEPTH =
  "CHECK_DEPENDENCIES_AT_GIVEN_DEPTH";
export const CHECK_DEAD_FILES = "CHECK_DEAD_FILES";
export const CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS =
  "CHECK_FILES_CONTRIBUTING_IN_MULTIPLE_CHUNKS";
export const CHECK_CHUNK_METADATA_USING_GIVEN_FILE =
  "CHECK_CHUNK_METADATA_USING_GIVEN_FILE";
export const DISPLAY_TEXT = "DISPLAY_TEXT";

export const MESSAGE = "message";
export const ERROR = "error";
export const RUNNER_FILE = "runner.js";
export const SIGINT = "SIGINT";

export const GREEN_COLOR = "\x1b[32m";
export const YELLOW_COLOR = "\x1b[33m";
export const CLEAR = "\x1Bc";
export const BOLD = "\x1b[1m";

export const CHECK_ALL_IMPORTS_ADDRESSES = "CHECK_ALL_IMPORTS_ADDRESSES";
export const CHECK_STATIC_IMPORTS_ADDRESSES = "CHECK_STATIC_IMPORTS_ADDRESSES";
export const CHECK_IMPORTS = "CHECK_IMPORTS";
export const CHECK_USAGE = "CHECK_USAGE";
export const CHECK_EXPORTS = "CHECK_EXPORTS";

export const ALL_EXPORTS_AS_OBJECT = "ALL_EXPORTS_AS_OBJECT";
export const ALL_EXPORTS_IMPORTED = "ALL_EXPORTS_IMPORTED";
export const INDIVIDUAL_IMPORT = "INDIVIDUAL_IMPORT";

export const DEFAULT_OBJECT_EXPORT = "DEFAULT_OBJECT_EXPORT";
export const NORMAL_EXPORT = "NORMAL_EXPORT";

export const UPDATE_REFERENCE_COUNT = "UPDATE_REFERENCE_COUNT";
export const DONT_UPDATE_REFERENCE_COUNT = "DONT_UPDATE_REFERENCE_COUNT";

export const JSCONFIG_FILE = "jsconfig.json";
export const TSCONFIG_FILE = "tsconfig.json";

export const IMPORT_SPECIFIER = "ImportSpecifier";
export const IMPORT_DEFAULT_SPECIFIER = "ImportDefaultSpecifier";
export const EXPORT_SPECIFIER = "ExportSpecifier";
export const EXPORT_NAMESPACE_SPECIFIER = "ExportNamespaceSpecifier";

export const FILE = "FILE";
export const UNRESOLVED_TYPE = "UNRESOLVED TYPE";
export const INBUILT_NODE_MODULE = "INBUILT_NODE_MODULE";

export const OBJECT_PATTERN = "ObjectPattern";
export const IDENTIFIER = "Identifier";
export const TS_QUALIFIED_NAME = "TSQualifiedName";
export const OBJECT_PROPERTY = "ObjectProperty";
export const CALL_EXPRESSION = "CallExpression";
export const AWAIT_EXPRESSION = "AwaitExpression";
export const STRING_LITERAL = "StringLiteral";
export const TEMPLATE_LITERAL = "TemplateLiteral";
export const MEMBER_EXPRESSION = "MemberExpression";
export const OBJECT_EXPRESSION = "ObjectExpression";

export const DEFAULT = "default";
export const NAMED_EXPORT = "namedExport";
export const ALL_EXPORTED = "allExported";

export const LEFT = "left";
export const RIGHT = "right";
export const NONE = "NONE";
export const CHUNKS = "chunks";
export const NUMBER = "number";
export const BOOLEAN = "boolean";
export const TRUE = "true";
export const WEBPACK_CHUNK_NAME = "webpackChunkName";
export const EMPTY_STRING = "";
export const SPACE = " ";
export const GO_BACK = "Go Back";

export const OBJECT = "object";
export const PROPERTY = "property";
export const IMPORT = "Import";
export const THEN = "then";
export const REQUIRE = "require";
export const MODULE = "module";
export const EXPORTS = "exports";

export const DEFAULT_ENTRY_ARRAY = [/.[jt]sx?$/];
export const DEFAULT_REGEX_STRING = "!^()";
export const DEFAULT_TRUE_REGEX_STRING = "^()";
export const IGNORED_FILES_REGEX =
  /(\.git)|(\.spec\.(.*))|(\.mock\.(.*))|(\.fixtures?\.(.*))|(\.test\.(.*))|\.json$|\.md$|\.jpe?g$|\.png$|\.woff2$|\.hdr$|\.mp[0-9]$|\.svg$|\.glb$|\.mdx$|\.webp$|\.jade$|\.coffee$|\.styl$|\.story\.(.*)|\.babelrc$|\.env$|\.config\.(.*)/;
export const IGNORED_FOLDERS_REGEX =
  /node_modules|__spec__|__mocks?__|__tests?__|__fixtures?__|\/spec\/|\/tests?\/|\/mocks?\/|\/fixtures?\/|__generated__|storybook|stories/;

export const VALID_EXTENSIONS_ARRAY = [".js", ".jsx", ".ts", ".tsx", ".d.ts"];
export const DEFAULT_MODULES_ARRAY = ["src", "node_modules"];
export const SIZES_ARRAY = ["B", "KB", "MB", "GB", "TB", "PB"];

export const SUCCESSFUL_RETRIEVAL_OF_ALL_FILES_MESSAGE =
  "Successfully retrieved all files inside the directories to check";
export const SUCCESSFUL_RETRIEVAL_OF_ALL_ENTRY_FILES_MESSAGE =
  "Successfully retrieved all entry files";
export const ANALYSED_CODEBASE_MESSAGE = "Analysed the codebase";
export const SUCCESSFUL_IDENTIFICATION_OF_DEAD_FILES_MESSAGE =
  "Successfully identified all dead files";
export const UNSUCCESSFUL_IDENTIFICATION_OF_DEAD_FILES_MESSAGE =
  "Unable to identify few dead files";
export const SUCCESSFUL_IDENTIFICATION_OF_ALL_DEPENDENCIES_AT_GIVEN_DEPTH_MESSAGE =
  "Successfully identified all dependencies at the provided depth";
export const UNSUCCESSFUL_IDENTIFICATION_OF_ALL_DEPENDENCIES_AT_GIVEN_DEPTH_MESSAGE =
  "Unable to identify few dependencies at the provided depth";
export const ESTABLISHED_RELATIONSHIP_BETWEEN_FILES_MESSAGE =
  "Established relationship between different files";
export const IDENTIFICATION_OF_GIVEN_FILE_CHUNK_METADATA_MESSAGE =
  "Identified all the files along with their effective size which are present inside the chunk";
