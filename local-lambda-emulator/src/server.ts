import { serve, spawn } from "bun";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { buildLocal } from "../../be/build-script/build-api";

const PORT = process.env.PORT || 3002;
const LLRT_PATH = process.env.LLRT_PATH || "../llrt";
const BE_PATH = process.env.BE_PATH || "../be";

interface PendingRequest {
  req: Request;
  resolve: (response: Response) => void;
}

const requestQueue: PendingRequest[] = [];
let currentRequest: PendingRequest | null = null;
let buildContext: any = null;

async function checkLLRT(): Promise<boolean> {
  if (!existsSync(LLRT_PATH)) {
    console.error(`LLRT binary not found at ${LLRT_PATH}`);
    console.error(
      "Please run 'bun download-llrt.ts' from the root directory to download LLRT"
    );
    throw new Error("LLRT binary is required but not found");
  }
  return true;
}

async function setupBuild() {
  const distPath = join(BE_PATH, "dist");
  if (!existsSync(distPath)) {
    mkdirSync(distPath, { recursive: true });
  }

  // Build with watch mode using the API
  buildContext = await buildLocal(true);
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

  const errors = await new Response(proc.stderr).text();

  if (errors) {
    console.error("LLRT errors:", errors);
  }

  await proc.exited;
}

serve({
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

try {
  await checkLLRT();
} catch (error) {
  console.error("Failed to initialize:", error.message);
  process.exit(1);
}

// Setup build and start watching
await setupBuild();

// Cleanup on exit
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  if (buildContext) {
    await buildContext.dispose();
  }
  process.exit(0);
});
