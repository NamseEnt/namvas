import { routes } from "./routes";

const server = Bun.serve({
  port: 3002,
  async fetch(request) {
    const url = new URL(request.url);
    const endpoint = url.pathname.slice(1); // Remove leading /

    if (request.method === "GET" && endpoint === "health") {
      return new Response("OK", { status: 200 });
    }

    if (request.method === "POST" && Object.keys(routes).includes(endpoint)) {
      try {
        let reqBody = {};
        if (request.headers.get("content-type")?.includes("application/json")) {
          reqBody = await request.json();
        }

        const handler = routes[endpoint as keyof typeof routes];
        if (!handler) {
          throw new Error(`Handler not found for endpoint: ${endpoint}`);
        }
        const result = await handler(reqBody);

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      } catch (error) {
        console.error("API Error:", error);
        return new Response(
          JSON.stringify({ error: "Internal Server Error" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Development server running on http://localhost:${server.port}`);
console.log(`📋 Available endpoints: ${Object.keys(routes).join(", ")}`);
