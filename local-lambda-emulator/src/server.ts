import { serve } from "bun";
import { spawn } from "bun";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import * as esbuild from "esbuild";

const PORT = process.env.PORT || 3002;
const LLRT_PATH = process.env.LLRT_PATH || "./llrt";
const BE_PATH = process.env.BE_PATH || "../be";

interface PendingRequest {
  req: Request;
  resolve: (response: Response) => void;
}

const requestQueue: PendingRequest[] = [];
let currentRequest: PendingRequest | null = null;
let esbuildContext: esbuild.BuildContext | null = null;

async function checkLLRT(): Promise<boolean> {
  if (!existsSync(LLRT_PATH)) {
    console.warn(`LLRT not found at ${LLRT_PATH}`);
    console.warn(
      "Please install LLRT from https://github.com/awslabs/llrt/releases"
    );
    console.warn("Running in test mode without LLRT");
    return true; // Continue in test mode
  }
  return true;
}

async function setupEsbuild() {
  const distPath = join(BE_PATH, "dist");
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  }

  esbuildContext = await esbuild.context({
    entryPoints: [join(BE_PATH, "src/entry/local-entry.ts")],
    outfile: join(BE_PATH, "dist/local-entry.js"),
    platform: "browser",
    target: "es2023",
    format: "esm",
    bundle: true,
    minify: true,
    external: ["@aws-sdk", "@smithy"],
    logLevel: "info",
  });

  await esbuildContext.rebuild();
  console.log("Initial build complete");

  await esbuildContext.watch();
  console.log("Watching for changes in", join(BE_PATH, "src"));
}

async function executeLLRT() {
  const entryFile = join(BE_PATH, "dist", "local-entry.js");

  if (!existsSync(entryFile)) {
    throw new Error(`Entry file not found: ${entryFile}`);
  }

  const env = {
    ...process.env,
    PORT: PORT.toString(),
    LOCAL_DEV: "1",
  };

  const executable = existsSync(LLRT_PATH) ? LLRT_PATH : "node";
  const proc = spawn([executable, entryFile], {
    env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  const errors = await new Response(proc.stderr).text();

  if (errors) {
    console.error("LLRT errors:", errors);
  }

  await proc.exited;
}

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/__emulator/request") {
      if (!currentRequest) {
        return new Response("No pending request", { status: 404 });
      }

      const requestData = {
        method: currentRequest.req.method,
        url: currentRequest.req.url,
        headers: Object.fromEntries(currentRequest.req.headers.entries()),
        body: await currentRequest.req.text(),
      };

      return Response.json(requestData);
    }

    if (url.pathname === "/__emulator/response") {
      if (!currentRequest) {
        return new Response("No pending request", { status: 404 });
      }

      const responseData = await req.json();
      const response = new Response(responseData.body, {
        status: responseData.status,
        headers: responseData.headers,
      });

      currentRequest.resolve(response);
      currentRequest = null;

      // Process next request in queue
      if (requestQueue.length > 0) {
        currentRequest = requestQueue.shift()!;
        executeLLRT().catch((error) => {
          console.error("LLRT execution error:", error);
          if (currentRequest) {
            currentRequest.resolve(
              new Response("Internal Server Error", { status: 500 })
            );
            currentRequest = null;
          }
        });
      }

      return new Response("OK");
    }

    // Regular request - add to queue
    return new Promise<Response>((resolve) => {
      const pending = { req, resolve };

      if (!currentRequest) {
        currentRequest = pending;
        executeLLRT().catch((error) => {
          console.error("LLRT execution error:", error);
          if (currentRequest) {
            currentRequest.resolve(
              new Response("Internal Server Error", { status: 500 })
            );
            currentRequest = null;
          }
        });
      } else {
        requestQueue.push(pending);
      }

      setTimeout(() => {
        if (currentRequest === pending) {
          currentRequest = null;
          resolve(new Response("Request timeout", { status: 504 }));
        } else {
          const index = requestQueue.indexOf(pending);
          if (index !== -1) {
            requestQueue.splice(index, 1);
            resolve(new Response("Request timeout", { status: 504 }));
          }
        }
      }, 30000);
    });
  },
});

console.log(`Local Lambda Emulator running on http://localhost:${PORT}`);

if (!(await checkLLRT())) {
  process.exit(1);
}

// Setup esbuild and start watching
await setupEsbuild();

// Cleanup on exit
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  if (esbuildContext) {
    await esbuildContext.dispose();
  }
  process.exit(0);
});
