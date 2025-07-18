#!/usr/bin/env bun

import * as path from "path";
import * as fs from "fs";

const LLRT_REPO = "awslabs/llrt";

function getOsArch(): string {
  const platform = process.platform;
  const arch = process.arch;

  let osName: string;
  let archName: string;

  switch (platform) {
    case "darwin":
      osName = "darwin";
      break;
    case "linux":
      osName = "linux";
      break;
    case "win32":
      osName = "windows";
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  switch (arch) {
    case "x64":
      archName = "x64";
      break;
    case "arm64":
      archName = "arm64";
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }

  return `${osName}-${archName}`;
}

async function downloadLlrt() {
  const osArch = getOsArch();
  const extension = process.platform === "win32" ? ".zip" : ".zip";
  const filename = `llrt-${osArch}${extension}`;

  console.log(`Downloading LLRT for ${osArch}...`);

  const downloadUrl = `https://github.com/${LLRT_REPO}/releases/latest/download/${filename}`;

  try {
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const beDir = path.dirname(new URL(import.meta.url).pathname);
    const zipPath = path.join(beDir, filename);
    const llrtPath = path.join(beDir, "llrt");

    // Check if llrt already exists
    if (fs.existsSync(llrtPath)) {
      console.log(`LLRT already exists at ${llrtPath}, skipping download`);
      return;
    }

    await Bun.write(zipPath, buffer);
    console.log(`Downloaded ${filename}`);

    if (process.platform !== "win32") {
      const proc = Bun.spawn(["unzip", "-o", zipPath, "-d", beDir]);
      await proc.exited;

      const proc2 = Bun.spawn(["chmod", "+x", llrtPath]);
      await proc2.exited;

      console.log(`Extracted and made llrt executable at ${llrtPath}`);

      const unlinkProc = Bun.spawn(["rm", zipPath]);
      await unlinkProc.exited;
      console.log(`Cleaned up ${filename}`);
    } else {
      console.log(`Please extract ${filename} manually to ${beDir}`);
    }
  } catch (error) {
    console.error("Error downloading LLRT:", error);
    process.exit(1);
  }
}

await downloadLlrt();
