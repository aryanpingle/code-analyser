module.exports = {
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

  OBJECT: "object",
  PROPERTY: "property",
  IMPORT: "Import",
  THEN: "then",
  REQUIRE: "require",
  MODULE: "module",
  EXPORTS: "exports",

  DEFAULT_REGEX_STRING: "!^()",
  DEFAULT_TRUE_REGEX_STRING: "^()",
  IGNORED_FILES_REGEX:
    /(\.git)|(\.spec\.(.*))|(\.mock\.(.*))|(\.fixtures?\.(.*))|(\.test\.(.*))|\.json$|\.md$|\.jpe?g$|\.png$|\.woff2$|\.hdr$|\.mp[0-9]$|\.svg$|\.glb$|\.mdx$|\.webp$|\.jade$|\.coffee$|\.styl$|\.story\.(.*)|\.babelrc$|\.env$|\.config\.(.*)/,
  IGNORED_FOLDERS_REGEX:
    /node_modules|__spec__|__mocks?__|__tests?__|__fixtures?__|\/spec\/|\/tests?\/|\/mocks?\/|\/fixtures?\/|__generated__|storybook|stories/,
};
