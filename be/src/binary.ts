import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { isLocalDev } from "./isLocalDev";
import { s3ClientConfig } from "./config";
import { SpawnOptions } from "child_process";
import { writeFile, access, chmod } from "fs/promises";

const s3Client = new S3Client(s3ClientConfig);
const MAGICK_PATH = `/tmp/magick-${getLambdaArchitecture()}`;

export async function imagick(
  args: string[],
  stdin?: Uint8Array
): Promise<number> {
  const exists = await checkMagickExists();

  if (!exists) {
    await downloadAndExtractMagick();
  }

  return await spawnAsync(
    MAGICK_PATH,
    args,
    {
      env: process.env,
    },
    stdin
  );
}

const BINARY_ASSETS_BUCKET_NAME =
  process.env.BINARY_ASSETS_BUCKET_NAME ||
  (isLocalDev() ? "namvas-binary-assets-local" : undefined);

function getLambdaArchitecture(): string {
  // AWS Lambda 환경에서는 환경변수나 /proc/cpuinfo를 통해 확인
  let arch = process.arch;

  // Lambda Runtime API에서 아키텍처 확인
  if (process.env.AWS_EXECUTION_ENV) {
    // Lambda 환경인 경우
    const execEnv = process.env.AWS_EXECUTION_ENV;
    if (execEnv.includes("arm64") || execEnv.includes("aarch64")) {
      arch = "arm64";
    } else {
      arch = "x64";
    }
  }


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

  const bytes = await response.Body.transformToByteArray();

  await writeFile(MAGICK_PATH, bytes);
  await chmod(MAGICK_PATH, 0o755);
}

async function checkMagickExists(): Promise<boolean> {
  try {
    await access(MAGICK_PATH);
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
    process.on("exit", (code) => {
      resolve(code || 0);
    });

    process.on("close", (code) => {
      resolve(code || 0);
    });
  });
}
