import { existsSync, mkdirSync } from "fs";
import { join } from "path/posix";
import { buildLocal } from "../../be/build-script/build-api";
import { BE_PATH } from "./server";

export async function setupBuild() {
  const distPath = join(BE_PATH, "dist");
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  }

  await buildLocal(true);
}
