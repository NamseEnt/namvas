import type {
  APIGatewayProxyStructuredResultV2,
  LambdaFunctionURLEvent,
} from "aws-lambda";
import { ApiRequest } from "../types";
import { apis } from "../apis";

export async function handler(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyStructuredResultV2> {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Extract API name from path like "/api/loginWithGoogle" -> "loginWithGoogle"
    // Handle double slashes by filtering empty parts
    const pathParts = event.rawPath.split("/").filter(part => part !== "");
    console.log("Path parts:", pathParts);
    
    const apiName = pathParts.includes("api") 
      ? pathParts[pathParts.indexOf("api") + 1] 
      : pathParts[0];
    
    console.log("Extracted API name:", apiName);
    const apiParams = event.body;

    const inCookies = (event.cookies || [])?.reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    const outCookies = { ...inCookies };

    const apiRequest: ApiRequest = {
      headers: event.headers as Record<string, string>,
      cookies: outCookies,
    };

    const api = apis[apiName as keyof typeof apis];
    if (!api) {
      console.log("API not found:", apiName, "Available APIs:", Object.keys(apis));
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Not found", apiName, availableApis: Object.keys(apis) }),
      };
    }
    if (!apiParams) {
      console.log("No API params provided");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Bad request" }),
      };
    }
    
    console.log("Parsing API params:", apiParams);
    const parsedParams = JSON.parse(apiParams);
    console.log("Calling API:", apiName, "with params:", parsedParams);
    
    const apiResult = await api(parsedParams, apiRequest);
    console.log("API result:", apiResult);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiResult),
      cookies: calculateLambdaOutCookies(inCookies, outCookies),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
    };
  }
}

function calculateLambdaOutCookies(
  inCookies: Record<string, string>,
  outCookies: Record<string, string>
): string[] {
  const lambdaOutCookies: string[] = [];
  for (const [key, value] of Object.entries(outCookies)) {
    if (inCookies[key] !== value) {
      lambdaOutCookies.push(`${key}=${value}`);
    }
  }
  for (const key of Object.keys(inCookies)) {
    if (!outCookies[key]) {
      lambdaOutCookies.push(`${key}=; Max-Age=0`);
    }
  }
  return lambdaOutCookies;
}
