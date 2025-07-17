import { serve, spawn } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { buildLocal } from "../../be/build-script/build-api";
import { ContainerPool } from "./container-pool";
import { createHash } from "crypto";

const PORT = process.env.PORT || 3003;
const BE_PATH = process.env.BE_PATH || join(__dirname, "../../be");

let buildContext: any = null;
let containerPool: ContainerPool | null = null;
let codeVersion: string = "";


async function ensureDockerImage(): Promise<void> {
  // Check if image exists
  const checkProc = spawn(["docker", "images", "-q", "local-lambda"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(checkProc.stdout).text();

  if (!output.trim()) {
    // Build the image
    const buildProc = spawn(
      ["docker", "build", "-f", "Dockerfile.lambda", "-t", "local-lambda", "."],
      {
        cwd: join(__dirname, ".."),
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    // Stream build output
    const stdoutReader = buildProc.stdout.getReader();
    const stderrReader = buildProc.stderr.getReader();

    (async () => {
      try {
        while (true) {
          const { done, value } = await stdoutReader.read();
          if (done) break;
          process.stdout.write(new TextDecoder().decode(value));
        }
      } catch (e) {}
    })();

    (async () => {
      try {
        while (true) {
          const { done, value } = await stderrReader.read();
          if (done) break;
          process.stderr.write(new TextDecoder().decode(value));
        }
      } catch (e) {}
    })();

    await buildProc.exited;

    if (buildProc.exitCode !== 0) {
      throw new Error("Failed to build Docker image");
    }
  }
}

async function setupBuild() {
  const distPath = join(BE_PATH, "dist");
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  }

  // Calculate initial code version
  updateCodeVersion();

  // Build with watch mode using the API
  buildContext = await buildLocal(true);
  
  // Set up file watcher for dist directory
  const watcher = Bun.file(join(BE_PATH, "dist/local-entry.js"));
  let lastModified = 0;
  
  setInterval(async () => {
    try {
      const stats = await watcher.exists();
      if (stats) {
        const currentModified = (await Bun.file(join(BE_PATH, "dist/local-entry.js")).lastModified);
        if (currentModified > lastModified && lastModified > 0) {
          console.log("Code change detected, invalidating containers...");
          updateCodeVersion();
          if (containerPool) {
            await containerPool.invalidateAll();
          }
        }
        lastModified = currentModified;
      }
    } catch (e) {
      // Ignore errors
    }
  }, 2000); // Check every 2 seconds
}

function updateCodeVersion() {
  // Generate a hash based on current timestamp for code version
  // This ensures all containers started after a rebuild will have a new version
  codeVersion = Date.now().toString(36);
  process.env.CODE_VERSION = codeVersion;
  console.log(`Code version updated: ${codeVersion}`);
}




serve({
  port: PORT,
  idleTimeout: 120, // 2분으로 설정 (long polling을 위해)
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/__emulator/request/")) {
      const containerId = url.pathname.split("/").pop()!;
      
      // Check container version from query params
      const containerVersion = url.searchParams.get("version");
      if (containerVersion && containerVersion !== codeVersion) {
        // Container is running old code, tell it to shut down
        return new Response("CODE_VERSION_MISMATCH", { status: 410 });
      }
      
      // ContainerPool에서 이 컨테이너의 요청을 가져옴
      if (!containerPool) {
        return new Response("Service not ready", { status: 503 });
      }
      
      const request = containerPool.getRequestForContainer(containerId);
      if (request) {
        return Response.json(request);
      }
      
      // 요청이 없으면 long polling - 대기
      return containerPool.waitForRequest(containerId);
    }

    if (url.pathname.startsWith("/__emulator/response/")) {
      const containerId = url.pathname.split("/").pop()!;
      
      if (!containerPool) {
        return new Response("Service not ready", { status: 503 });
      }

      const responseData = (await req.json()) as {
        headers: Record<string, string>;
        cookies: string[];
        body: string;
        status: number;
      };

      // ContainerPool에 응답 전달
      containerPool.handleResponse(containerId, responseData);
      
      return new Response("OK");
    }

    // Regular request - ContainerPool이 처리
    if (!containerPool) {
      return new Response("Service not ready", { status: 503 });
    }
    
    const body = await req.text();
    const requestData = {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      body,
    };
    
    return containerPool.handleRequest(requestData);
  },
});


// 시작 전 기존 컨테이너 정리
async function cleanupExistingContainers() {
  console.log("Cleaning up existing containers...");
  const proc = spawn(["docker", "ps", "-aq", "-f", "name=lambda-"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const output = await new Response(proc.stdout).text();
  const containerIds = output.trim().split('\n').filter(id => id);
  
  if (containerIds.length > 0 && containerIds[0] !== '') {
    console.log(`Found ${containerIds.length} existing containers to clean up`);
    // Force remove all containers (stop + rm in one command)
    try {
      await spawn(["docker", "rm", "-f", ...containerIds]).exited;
      console.log(`Cleaned up ${containerIds.length} existing containers`);
    } catch (e) {
      console.error("Error cleaning up containers:", e);
    }
  }
}

console.log(`Local Lambda Emulator running on http://localhost:${PORT}`);

// 시작 전 기존 컨테이너 정리
await cleanupExistingContainers();

// 항상 Docker 사용
await ensureDockerImage();

// 코드 버전 초기화 (컨테이너 생성 전에 필요)
updateCodeVersion();

// 코드 버전을 환경변수로 설정
process.env.CODE_VERSION = codeVersion;

containerPool = new ContainerPool({
  minSize: 2,
  maxSize: 10,
});
await containerPool.initialize();

await setupBuild();

// Cleanup on exit
const cleanup = async () => {
  console.log("\nShutting down...");
  if (buildContext) {
    await buildContext.dispose();
  }
  if (containerPool) {
    await containerPool.shutdown();
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", () => {
  // 동기적으로 컨테이너 정리 시도
  try {
    const proc = Bun.spawnSync(["docker", "ps", "-q", "-f", "name=lambda-"]);
    if (proc.stdout) {
      const output = proc.stdout.toString();
      const containerIds = output.trim().split('\n').filter((id: string) => id);
      if (containerIds.length > 0) {
        Bun.spawnSync(["docker", "stop", ...containerIds]);
      }
    }
  } catch (e) {
    // 종료 시 오류 무시
  }
});
