import { serve } from "bun";
import { join } from "path";
import { ensureDockerImage } from "./ensureDockerImage";
import { setupBuild } from "./setupBuild";
import { executeLLRT } from "./executeLLRT";

export const PORT = 3003;
export const BE_PATH = join(__dirname, "../../be");

interface PendingRequest {
  req: Request;
  resolve: (response: Response) => void;
}

const requestQueue: PendingRequest[] = [];
let currentRequest: PendingRequest | null = null;

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

await ensureDockerImage();
await setupBuild();
startScheduler(); // 디버깅을 위해 임시로 비활성화

// Cleanup on exit
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  process.exit(0);
});
