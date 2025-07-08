import { serve, spawn } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { buildLocal } from "../../be/build-script/build-api";

const PORT = process.env.PORT || 3003;
const LLRT_PATH = process.env.LLRT_PATH || join(__dirname, "../../llrt");
const BE_PATH = process.env.BE_PATH || join(__dirname, "../../be");

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

async function executeLLRT(
  entry: "local-entry" | "local-scheduler-entry",
  argv2?: string
) {
  const entryFile = join(BE_PATH, "dist", `${entry}.js`);

  if (!existsSync(entryFile)) {
    throw new Error(`Entry file not found: ${entryFile}`);
  }

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

  const env = {
    ...process.env,
    ...envVars,
    PORT: PORT.toString(),
    LOCAL_DEV: "1",
    // Override localhost URLs for Docker environment
    ...(process.env.AWS_ENDPOINT_URL && {
      QUEUE_URL: process.env.AWS_ENDPOINT_URL + "/000000000000/main-queue"
    })
  };

  if (!existsSync(LLRT_PATH)) {
    throw new Error(`LLRT binary not found at ${LLRT_PATH}`);
  }
  const proc = spawn([LLRT_PATH, entryFile, argv2 ?? ""], {
    env,
    stdout: "pipe",
    stderr: "pipe",
  });

  // Capture and display stdout (console.log outputs)
  const stdoutReader = proc.stdout.getReader();
  const stderrReader = proc.stderr.getReader();

  // Read stdout in background
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

      const responseData = (await req.json()) as {
        headers: Record<string, string>;
        cookies: string[];
        body: string;
        status: number;
      };

      // Handle cookies from Lambda response
      const responseHeaders = { ...responseData.headers };
      if (responseData.cookies && responseData.cookies.length > 0) {
        responseHeaders["Set-Cookie"] = responseData.cookies
          .map((cookie) => `${cookie.split("=")[0]}=${cookie.split("=")[1]}`)
          .join("; ");
      }

      const response = new Response(responseData.body, {
        status: responseData.status,
        headers: responseHeaders,
      });

      currentRequest.resolve(response);
      currentRequest = null;

      // Process next request in queue
      if (requestQueue.length > 0) {
        currentRequest = requestQueue.shift()!;
        executeLLRT("local-entry").catch((error) => {
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
        executeLLRT("local-entry").catch((error) => {
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

function startScheduler() {
  setInterval(() => {
    executeLLRT(
      "local-scheduler-entry",
      JSON.stringify({ type: "verifyPayments", body: JSON.stringify({}) })
    ).catch((error) => {
      console.error("LLRT execution error:", error);
    });
  }, 10 * 1000);
}

console.log(`Local Lambda Emulator running on http://localhost:${PORT}`);

await checkLLRT();
await setupBuild();
startScheduler();

// Cleanup on exit
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  if (buildContext) {
    await buildContext.dispose();
  }
  process.exit(0);
});
