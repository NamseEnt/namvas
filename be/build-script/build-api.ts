import esbuild from "esbuild";
import { localOptions } from "./esbuild.config";
import * as path from "path";

export async function buildLocal(
  watch: boolean = false
): Promise<esbuild.BuildContext | void> {
  const beDir = path.join(__dirname, "..");

  const entryPoints = localOptions.entryPoints;
  if (entryPoints) {
    if (Array.isArray(entryPoints)) {
      entryPoints.forEach((entry, index) => {
        if (typeof entry === "string") {
          entryPoints[index] = path.resolve(beDir, entry);
        } else {
          entry.in = path.resolve(beDir, entry.in);
          entry.out = path.resolve(beDir, entry.out);
        }
      });
    } else {
      Object.entries(entryPoints).forEach((entry) => {
        entry[0] = path.resolve(beDir, entry[0]);
        entry[1] = path.resolve(beDir, entry[1]);
      });
    }
  }

  // Create adjusted options with absolute paths
  const adjustedOptions = {
    ...localOptions,
    entryPoints,
    outfile: path.resolve(beDir, localOptions.outfile ?? ""),
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
