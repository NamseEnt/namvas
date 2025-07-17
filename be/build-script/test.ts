import esbuild from "esbuild";
import { testOptions } from "./esbuild.config";

async function main() {
  try {
    await esbuild.build(testOptions);
    console.log("✅ Test build completed");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();