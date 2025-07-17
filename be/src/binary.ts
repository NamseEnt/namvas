import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { isLocalDev } from "./isLocalDev";
import { s3ClientConfig } from "./config";
import { SpawnOptions } from "child_process";
import { writeFile } from "fs/promises";

const s3Client = new S3Client(s3ClientConfig);
const MAGICK_PATH = `/tmp/magick-${getLambdaArchitecture()}`;
const MAGICK_BINARY_PATH = `${MAGICK_PATH}/bin/magick`;
const MAGICK_LD_LIBRARY_PATH = `${MAGICK_PATH}/lib`;

export async function imagick(
  args: string[],
  stdin?: Uint8Array
): Promise<number> {
  const exists = await checkMagickExists();

  if (!exists) {
    await downloadAndExtractMagick();
  }

  return await spawnAsync(
    MAGICK_BINARY_PATH,
    args,
    {
      env: {
        ...process.env,
        LD_LIBRARY_PATH: `${MAGICK_LD_LIBRARY_PATH}:${process.env.LD_LIBRARY_PATH || ""}`,
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

async function downloadAndExtractMagick() {
  if (!BINARY_ASSETS_BUCKET_NAME) {
    throw new Error("BINARY_ASSETS_BUCKET_NAME is not configured");
  }

  const arch = getLambdaArchitecture();
  const command = new GetObjectCommand({
    Bucket: BINARY_ASSETS_BUCKET_NAME,
    Key: `magick-${arch}`,
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`Failed to download magick-${arch} from S3`);
  }

  await writeFile(MAGICK_BINARY_PATH, response.Body as unknown as Uint8Array);
}

async function checkMagickExists(): Promise<boolean> {
  try {
    const { accessSync } = await import("fs");
    accessSync(MAGICK_BINARY_PATH);
    return true;
  } catch {
    return false;
  }
}

async function spawnAsync(
  command: string,
  args: string[],
  options: Omit<SpawnOptions, "stdio">,
  input?: Uint8Array
): Promise<number> {
  const { spawn } = await import("child_process");
  const process = spawn(command, args, {
    ...options,
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
