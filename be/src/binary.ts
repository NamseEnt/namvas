import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { isLocalDev } from "./isLocalDev";
import { s3ClientConfig } from "./config";

const s3Client = new S3Client(s3ClientConfig);

export async function imagick(args: string[]): Promise<number> {
  const exists = await checkImageMagickExists();

  if (!exists) {
    await downloadAndExtractImageMagick();
  }

  try {
    const { spawnSync } = await import("child_process");
    const result = spawnSync(IMAGEMAGICK_BINARY_PATH, args, {
      stdio: "pipe",
      env: {
        ...process.env,
        LD_LIBRARY_PATH: `/tmp/imagemagick/lib:${process.env.LD_LIBRARY_PATH || ""}`,
      },
    });

    return result.status || 0;
  } catch (error) {
    console.error("Failed to execute ImageMagick:", error);
    return 1;
  }
}

const BINARY_ASSETS_BUCKET_NAME =
  process.env.BINARY_ASSETS_BUCKET_NAME ||
  (isLocalDev() ? "namvas-binary-assets-local" : undefined);

function getLambdaArchitecture(): string {
  const arch = process.arch;
  switch (arch) {
    case "x64":
      return "x64";
    case "arm64":
      return "arm64";
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }
}

const IMAGEMAGICK_BINARY_PATH = "/tmp/imagemagick/bin/magick";

async function downloadAndExtractImageMagick() {
  if (!BINARY_ASSETS_BUCKET_NAME) {
    throw new Error("BINARY_ASSETS_BUCKET_NAME is not configured");
  }

  const arch = getLambdaArchitecture();
  const command = new GetObjectCommand({
    Bucket: BINARY_ASSETS_BUCKET_NAME,
    Key: `imagemagick-${arch}.tar.zst`,
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`Failed to download imagemagick-${arch}.tar.zst from S3`);
  }

  const { spawn } = await import("child_process");

  const tarProcess = spawn("tar", ["--zstd", "-xf", "-", "-C", "/tmp"], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  for await (const chunk of response.Body.transformToWebStream()) {
    tarProcess.stdin.write(chunk);
  }
  tarProcess.stdin.end();

  return new Promise<void>((resolve, reject) => {
    tarProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tar process exited with code ${code}`));
      }
    });
  });
}

async function checkImageMagickExists(): Promise<boolean> {
  try {
    const { accessSync } = await import("fs");
    accessSync(IMAGEMAGICK_BINARY_PATH);
    return true;
  } catch {
    return false;
  }
}
