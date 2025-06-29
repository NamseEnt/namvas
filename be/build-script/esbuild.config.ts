import type { BuildOptions } from "esbuild";
import { schemaPlugin } from "./esbuild-schema-plugin";

// Common build options
export const commonOptions: BuildOptions = {
  platform: "browser",
  target: "es2023",
  format: "esm",
  bundle: true,
  external: [
    "@aws-sdk",
    "@smithy",
    "assert",
    "console",
    "node:console",
    "crypto",
    "dns",
    "os",
    "fs",
    "child_process",
    "process",
    "timers",
    "stream",
    "path",
    "events",
    "buffer",
    "net",
    "util",
    "url",
    "zlib",
    "llrt:hex",
    "llrt:util",
    "llrt:uuid",
    "llrt:xml",
    "perf_hooks",
    "tty",
    "string_decoder",
    "@aws-crypto",
  ],
  plugins: [schemaPlugin],
};

// Lambda build configuration
export const lambdaOptions: BuildOptions = {
  ...commonOptions,
  entryPoints: ["src/entry/lambda-entry.ts"],
  outfile: "dist/lambda-entry.js",
  minify: true,
};

// Test build configuration
export const testOptions: BuildOptions = {
  ...commonOptions,
  entryPoints: ["test/*.test.ts"],
  outdir: "dist",
  minify: false,
};
