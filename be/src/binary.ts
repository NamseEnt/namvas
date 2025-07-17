import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { isLocalDev } from "./isLocalDev";
import { s3ClientConfig } from "./config";
import { SpawnOptions } from "child_process";

const s3Client = new S3Client(s3ClientConfig);
const IMAGEMAGICK_PATH = `/tmp/imagemagick-${getLambdaArchitecture()}`;
const IMAGEMAGICK_BINARY_PATH = `${IMAGEMAGICK_PATH}/bin/magick`;
const IMAGEMAGICK_LD_LIBRARY_PATH = `${IMAGEMAGICK_PATH}/lib`;

export async function imagick(
  args: string[],
  stdin?: Uint8Array
): Promise<number> {
  const exists = await checkImageMagickExists();

  if (!exists) {
    await downloadAndExtractImageMagick();
  }

  return await spawnAsync(
    IMAGEMAGICK_BINARY_PATH,
    args,
    {
      stdio: "pipe",
      env: {
        ...process.env,
        LD_LIBRARY_PATH: `${IMAGEMAGICK_LD_LIBRARY_PATH}:${process.env.LD_LIBRARY_PATH || ""}`,
      },
    },
    stdin
  );
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

  return await spawnAsync(
    "tar",
    ["--zstd", "-xmf", "-", "-C", "/tmp"],
    {
      stdio: ["pipe", "pipe", "inherit"],
    },
    // llrt doesn't support streaming blob payload input types
    response.Body as unknown as Uint8Array
  );
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

async function spawnAsync(
  command: string,
  args: string[],
  options: SpawnOptions,
  input?: Uint8Array
): Promise<number> {
  const { spawn } = await import("child_process");
  const process = spawn(command, args, {
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (input) {
    process.stdin.write(input);
    process.stdin.end();
  }

  return new Promise<number>((resolve) => {
    process.on("close", (code) => {
      resolve(code || 0);
    });
  });
}
