import esbuild from "esbuild";
import { lambdaOptions } from "./esbuild.config";

async function main() {
  try {
    await esbuild.build(lambdaOptions);
  } catch (error) {
    process.exit(1);
  }
}

main();
