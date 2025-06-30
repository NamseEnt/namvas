import esbuild from "esbuild";
import { lambdaOptions } from "./esbuild.config";

async function main() {
  try {
    await esbuild.build(lambdaOptions);
    console.log("✅ Lambda build completed");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();