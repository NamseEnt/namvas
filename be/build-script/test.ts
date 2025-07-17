import esbuild from "esbuild";
import { testOptions } from "./esbuild.config";

async function main() {
  try {
    await esbuild.build(testOptions);
  } catch (error) {
    process.exit(1);
  }
}

main();
