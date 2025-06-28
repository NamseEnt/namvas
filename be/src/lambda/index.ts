import { routes } from "../routes";

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const event = await request.json();
      
      // Handle API Gateway events
      if (event.httpMethod && event.path) {
        const endpoint = event.path.slice(1); // Remove leading /
        
        if (event.httpMethod === "GET" && endpoint === "health") {
          return new Response(JSON.stringify({ statusCode: 200, body: "OK" }));
        }

        if (event.httpMethod === "POST" && Object.keys(routes).includes(endpoint)) {
          let reqBody = {};
          if (event.body) {
            try {
              reqBody = JSON.parse(event.body);
            } catch {
              reqBody = {};
            }
          }

          const handler = routes[endpoint as keyof typeof routes];
          if (!handler) {
            throw new Error(`Handler not found for endpoint: ${endpoint}`);
          }
          const result = await handler(reqBody);
          
          return new Response(JSON.stringify({
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
            body: JSON.stringify(result),
          }));
        }

        if (event.httpMethod === "OPTIONS") {
          return new Response(JSON.stringify({
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
            body: "",
          }));
        }

        return new Response(JSON.stringify({
          statusCode: 404,
          body: JSON.stringify({ error: "Not Found" }),
        }));
      }

      // Handle other Lambda events (SQS, EventBridge, etc.)
      console.log("Non-HTTP event received:", event);
      return new Response(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({ message: "Event processed" }),
      }));
      
    } catch (error) {
      console.error("Lambda Error:", error);
      return new Response(JSON.stringify({
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal Server Error" }),
      }));
    }
  },
};