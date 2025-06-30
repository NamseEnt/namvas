import esbuild from "esbuild";
import { localOptions } from "./esbuild.config";

export async function buildLocal(watch: boolean = false): Promise<esbuild.BuildContext | void> {
  if (watch) {
    const context = await esbuild.context(localOptions);
    await context.rebuild();
    console.log("✅ Local build completed");
    await context.watch();
    console.log("👀 Watching for changes...");
    return context;
  } else {
    await esbuild.build(localOptions);
    console.log("✅ Local build completed");
  }
}