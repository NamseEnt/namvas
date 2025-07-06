import type {
  APIGatewayProxyStructuredResultV2,
  LambdaFunctionURLEvent,
  SQSEvent,
} from "aws-lambda";
import { ApiRequest } from "../types";
import { apis } from "../apis";
import { queueProcessor } from "../handlers/queueProcessor";

export async function handler(
  event: LambdaFunctionURLEvent | SQSEvent
): Promise<APIGatewayProxyStructuredResultV2 | void> {
  // SQS 이벤트인지 확인
  if ('Records' in event && event.Records?.[0]?.eventSource === 'aws:sqs') {
    console.log('[Lambda] Processing SQS event');
    await queueProcessor(event as SQSEvent, {} as any, {} as any);
    return; // SQS 처리는 응답이 필요 없음
  }

  // API 이벤트 처리
  const apiEvent = event as LambdaFunctionURLEvent;
  // Simplified logging - only log method and path
  console.log(`[Lambda] ${apiEvent.requestContext.http.method} ${apiEvent.rawPath}`);

  try {
    // Extract API name from path like "/api/loginWithGoogle" -> "loginWithGoogle"
    // Handle double slashes by filtering empty parts
    const pathParts = apiEvent.rawPath.split("/").filter(part => part !== "");
    // console.log("Path parts:", pathParts);
    
    const apiName = pathParts.includes("api") 
      ? pathParts[pathParts.indexOf("api") + 1] 
      : pathParts[0];
    
    // console.log("Extracted API name:", apiName);
    const apiParams = apiEvent.body;

    const inCookies = (apiEvent.cookies || [])?.reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    const outCookies = { ...inCookies };

    const apiRequest: ApiRequest = {
      headers: apiEvent.headers as Record<string, string>,
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
    
    const parsedParams = JSON.parse(apiParams);
    console.log(`[Lambda] Calling ${apiName}`);
    
    const apiResult = await api(parsedParams, apiRequest);
    // console.log("API result:", apiResult);

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
  const isLocalDev = process.env.LOCAL_DEV === "1";
  
  for (const [key, value] of Object.entries(outCookies)) {
    if (inCookies[key] !== value) {
      // For local development, use Lax SameSite
      // For production, use None with Secure
      if (isLocalDev) {
        lambdaOutCookies.push(`${key}=${value}; SameSite=Lax; Path=/; Max-Age=86400`);
      } else {
        lambdaOutCookies.push(`${key}=${value}; SameSite=None; Secure; Path=/; Max-Age=86400`);
      }
    }
  }
  for (const key of Object.keys(inCookies)) {
    if (!outCookies[key]) {
      lambdaOutCookies.push(`${key}=; Max-Age=0; Path=/`);
    }
  }
  return lambdaOutCookies;
}
