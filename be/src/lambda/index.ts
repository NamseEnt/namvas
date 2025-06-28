import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { routes } from "../routes";

export const handler = async (event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Handle API Gateway events
    if (event.httpMethod && event.path) {
      const endpoint = event.path.slice(1); // Remove leading /
      
      if (event.httpMethod === "GET" && endpoint === "health") {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
          },
          body: "OK",
        };
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
          return {
            statusCode: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Handler not found" }),
          };
        }

        const cookies = new Map<string, string>();
        // Parse cookies from event headers
        if (event.headers?.Cookie) {
          event.headers.Cookie.split(';').forEach((cookie: string) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
              cookies.set(key, value);
            }
          });
        }
        
        const result = await handler(reqBody, { cookies });
        
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: JSON.stringify(result),
        };
      }

      if (event.httpMethod === "OPTIONS") {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: "",
        };
      }

      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Not Found" }),
      };
    }

    // Handle other Lambda events (SQS, EventBridge, etc.)
    console.log("Non-HTTP event received:", event);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Event processed" }),
    };
    
  } catch (error) {
    console.error("Lambda Error:", error);
    return {
      statusCode: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};