import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fs",
              message: "Node.js 'fs' module is not supported in LLRT. Use AWS SDK or external storage instead."
            },
            {
              name: "path",
              message: "Node.js 'path' module is not supported in LLRT. Use string manipulation or URL APIs instead."
            },
            {
              name: "crypto",
              message: "Node.js 'crypto' module is not supported in LLRT. Use Web Crypto API or AWS KMS instead."
            },
            {
              name: "buffer",
              message: "Node.js 'buffer' module is not supported in LLRT. Use ArrayBuffer or Uint8Array instead."
            },
            {
              name: "stream",
              message: "Node.js 'stream' module is not supported in LLRT. Use ReadableStream/WritableStream instead."
            },
            {
              name: "util",
              message: "Node.js 'util' module is not supported in LLRT. Use native JavaScript alternatives."
            },
            {
              name: "os",
              message: "Node.js 'os' module is not supported in LLRT."
            },
            {
              name: "child_process",
              message: "Node.js 'child_process' module is not supported in LLRT."
            },
            {
              name: "cluster",
              message: "Node.js 'cluster' module is not supported in LLRT."
            },
            {
              name: "net",
              message: "Node.js 'net' module is not supported in LLRT. Use fetch() for HTTP requests."
            },
            {
              name: "http",
              message: "Node.js 'http' module is not supported in LLRT. Use fetch() instead."
            },
            {
              name: "https",
              message: "Node.js 'https' module is not supported in LLRT. Use fetch() instead."
            },
            {
              name: "events",
              message: "Node.js 'events' module is not supported in LLRT. Use DOM EventTarget instead."
            },
            {
              name: "worker_threads",
              message: "Node.js 'worker_threads' module is not supported in LLRT."
            },
            {
              name: "v8",
              message: "Node.js 'v8' module is not supported in LLRT."
            },
            {
              name: "vm",
              message: "Node.js 'vm' module is not supported in LLRT."
            },
            {
              name: "zlib",
              message: "Node.js 'zlib' module is not supported in LLRT. Use Web Compression Streams instead."
            }
          ],
          patterns: [
            {
              group: ["bun:*"],
              message: "Bun-specific modules are not supported in LLRT. Use standard JavaScript or Web APIs instead."
            },
            {
              group: ["node:*"],
              message: "Node.js built-in modules with 'node:' prefix are not supported in LLRT."
            }
          ]
        }
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "Buffer",
          message: "Global Buffer is not supported in LLRT. Use ArrayBuffer or Uint8Array instead."
        },
        {
          name: "__dirname",
          message: "__dirname is not supported in LLRT. Use import.meta.url instead."
        },
        {
          name: "__filename",
          message: "__filename is not supported in LLRT. Use import.meta.url instead."
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name!='env']",
          message: "Only process.env is supported in LLRT. Other process properties are not available."
        },
        {
          selector: "CallExpression[callee.name='require']",
          message: "CommonJS require() is not supported in LLRT. Use ES6 import instead."
        }
      ]
    }
  }
];