import esbuild from "esbuild";
import { localOptions } from "./esbuild.config";
import { join, resolve } from "path";

export async function buildLocal(watch: boolean = false): Promise<esbuild.BuildContext | void> {
  const beDir = join(__dirname, "..");
  
  // Create adjusted options with absolute paths
  const adjustedOptions = {
    ...localOptions,
    entryPoints: localOptions.entryPoints.map(entry => 
      resolve(beDir, entry)
    ),
    outfile: resolve(beDir, localOptions.outfile),
    absWorkingDir: beDir,
  };
  
  if (watch) {
    const context = await esbuild.context(adjustedOptions);
    await context.rebuild();
    console.log("✅ Local build completed");
    await context.watch();
    console.log("👀 Watching for changes...");
    return context;
  } else {
    await esbuild.build(adjustedOptions);
    console.log("✅ Local build completed");
  }
}