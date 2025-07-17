import { spawn } from "bun";
import { existsSync, readFileSync } from "fs";
import { join } from "path/posix";
import { BE_PATH, PORT } from "./server";

export async function executeLLRT(
  entry: "local-entry" | "local-scheduler-entry",
  argv2?: string
): Promise<void> {
  const entryFile = `dist/${entry}.js`;

  // Load .env file from BE directory
  const envPath = join(BE_PATH, ".env");
  let envVars = {};
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    envVars = Object.fromEntries(
      envContent
        .split("\n")
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("=").map((s) => s.trim()))
        .filter(([key, value]) => key && value)
    );
  }

  const AWS_ENDPOINT_URL = "http://host.docker.internal:4566";

  const env = {
    ...process.env,
    ...envVars,
    PORT: PORT.toString(),
    LOCAL_DEV: "1",
    EMULATOR_ENDPOINT: `http://host.docker.internal:${PORT}`,
    AWS_ENDPOINT_URL,
    QUEUE_URL: `${AWS_ENDPOINT_URL}/000000000000/main-queue`,
  };

  // Docker run 명령어 구성
  const dockerArgs = [
    "run",
    "--rm", // 컨테이너 자동 삭제
    "--add-host",
    "host.docker.internal:host-gateway", // macOS에서 호스트 접근을 위해 필요
    "-v",
    `${join(BE_PATH, "dist")}:/var/task/dist:ro`, // dist 디렉토리 마운트
    "-v",
    `${join(BE_PATH, ".env")}:/var/task/.env:ro`, // .env 파일 마운트
  ];

  // 환경 변수 추가
  Object.entries(env).forEach(([key, value]) => {
    dockerArgs.push("-e", `${key}=${value}`);
  });

  // 이미지 이름과 실행할 파일
  dockerArgs.push("local-lambda", entryFile);

  if (argv2) {
    dockerArgs.push(argv2);
  }

  const proc = spawn(["docker", ...dockerArgs], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdoutReader = proc.stdout.getReader();
  const stderrReader = proc.stderr.getReader();

  (async () => {
    try {
      while (true) {
        const { done, value } = await stdoutReader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        process.stdout.write(text);
      }
    } catch (e) {
      // Reader was closed
    }
  })();

  // Read stderr in background
  (async () => {
    try {
      while (true) {
        const { done, value } = await stderrReader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        process.stderr.write(text);
      }
    } catch (e) {
      // Reader was closed
    }
  })();

  await proc.exited;
}
