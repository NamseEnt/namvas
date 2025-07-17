import esbuild from "esbuild";
import { localOptions } from "./esbuild.config";

async function main() {
  const watch = process.argv.includes("--watch");

  try {
    if (watch) {
      const context = await esbuild.context(localOptions);
      await context.rebuild();
      console.log("✅ Local build completed");
      await context.watch();
      console.log("👀 Watching for changes...");
      
      // Keep the process running
      process.on("SIGINT", async () => {
        console.log("\nShutting down...");
        await context.dispose();
        process.exit(0);
      });
    } else {
      await esbuild.build(localOptions);
      console.log("✅ Local build completed");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();