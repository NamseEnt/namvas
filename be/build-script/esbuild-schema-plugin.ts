import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import type { Plugin } from "esbuild";
import { generateSchema } from "./generate-schema";

export const schemaPlugin: Plugin = {
  name: "schema-generation",
  setup(build) {
    // Run before build starts
    build.onStart(() => {
      try {
        // Use absWorkingDir if available, otherwise fall back to process.cwd()
        const workingDir = build.initialOptions.absWorkingDir || process.cwd();
        const schemaPath = join(workingDir, "src/schema.ts");
        const outputPath = join(workingDir, "src/__generated/db.ts");

        // Check if schema file exists
        if (!existsSync(schemaPath)) {
          console.warn("⚠️  Schema file not found at src/schema.ts");
          return;
        }

        // Ensure output directory exists
        mkdirSync(dirname(outputPath), { recursive: true });

        // Generate schema
        generateSchema(schemaPath, outputPath);
      } catch (error) {
        console.error("❌ Schema generation failed:", error);
        throw error; // Fail the build if schema generation fails
      }
    });
  },
};
