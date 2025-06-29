import esbuild from "esbuild";
import { lambdaOptions, testOptions } from "./esbuild.config";

async function main() {
  const command = process.argv[2];

  try {
    if (command === "lambda") {
      await esbuild.build(lambdaOptions);
      console.log("✅ Lambda build completed");
    } else if (command === "test") {
      await esbuild.build(testOptions);
      console.log("✅ Test build completed");
    } else {
      console.error("Usage: tsx build.ts [lambda|test]");
      process.exit(1);
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();