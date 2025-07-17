#!/usr/bin/env bun

import { watch } from "fs";
import { spawn } from "child_process";
import { dirname, resolve } from "path";

// Colors for output
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const NC = "\x1b[0m"; // No Color

// Get the schema file path from command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`Usage: bun run watch <schema-file.ts> [output-file]`);
  console.log(`Example: bun run watch ../db/src/schema.ts`);
  process.exit(1);
}

const schemaFile = resolve(args[0]);
const outputFile = args[1] || schemaFile.replace(/\.ts$/, ".generated.ts");

// Function to run schema generation
let isGenerating = false;
async function runSchemaGeneration() {
  if (isGenerating) {
    console.log(
      `${YELLOW}Schema generation already in progress, skipping...${NC}`
    );
    return;
  }

  isGenerating = true;
  console.log(`${YELLOW}Running schema generation...${NC}`);

  const child = spawn(
    "bun",
    ["run", resolve(__dirname, "typescript-cli.ts"), schemaFile, outputFile],
    {
      stdio: "inherit",
    }
  );

  return new Promise((resolve) => {
    child.on("close", (code) => {
      isGenerating = false;
      if (code === 0) {
        console.log(`${GREEN}Schema generation completed successfully!${NC}`);
      } else {
        console.log(`${RED}Schema generation failed with code ${code}${NC}`);
      }
      resolve(code);
    });
  });
}

// Initial run
console.log(`${GREEN}Starting schema generation in watch mode${NC}`);
console.log(`${YELLOW}Watching: ${schemaFile}${NC}`);
console.log(`${YELLOW}Output: ${outputFile}${NC}\n`);

runSchemaGeneration();

// Set up file watcher
const watcher = watch(schemaFile, async (eventType, filename) => {
  if (eventType === "change") {
    console.log(`\n${YELLOW}Schema file changed, regenerating...${NC}`);
    await runSchemaGeneration();
  }
});

// Handle exit gracefully
process.on("SIGINT", () => {
  console.log(`\n${YELLOW}Stopping schema watcher...${NC}`);
  watcher.close();
  process.exit(0);
});

console.log(`${GREEN}Watching for changes. Press Ctrl+C to stop.${NC}\n`);
