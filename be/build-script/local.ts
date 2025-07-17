import esbuild from "esbuild";
import { localOptions } from "./esbuild.config";

async function main() {
  const watch = process.argv.includes("--watch");

  try {
    if (watch) {
      const context = await esbuild.context(localOptions);
      await context.rebuild();
      await context.watch();

      // Keep the process running
      process.on("SIGINT", async () => {
        console.log("\nShutting down...");
        await context.dispose();
        process.exit(0);
      });
    } else {
      await esbuild.build(localOptions);
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();
