import type {
  APIGatewayProxyStructuredResultV2,
  LambdaFunctionURLEvent,
  SQSEvent,
} from "aws-lambda";
import { ApiRequest } from "../types";
import { apis } from "../apis";
import { schedulerHandlers } from "../scheduler";
import { QueueMessageSpec, sqsHandlers } from "../sqs";

export async function handler(
  event:
    | LambdaFunctionURLEvent
    | SQSEvent
    | { from: "eventBridgeScheduler"; type: string; body: string }
): Promise<APIGatewayProxyStructuredResultV2 | void> {
  if ("from" in event && event.from === "eventBridgeScheduler") {
    const { type, body } = event;
    const handler = schedulerHandlers[type as keyof typeof schedulerHandlers];
    if (!handler) {
      throw new Error(`No handler found for scheduler event type: ${type}`);
    }
    await handler(JSON.parse(body));
    return;
  }
  if ("Records" in event && event.Records?.[0]?.eventSource === "aws:sqs") {
    await Promise.all(
      (event as SQSEvent).Records.map(async (record) => {
        const message = JSON.parse(record.body);
        const { type, req } = message;

        console.log(`Processing SQS message: ${type}`);

        const handler = sqsHandlers[type as keyof QueueMessageSpec];
        if (!handler) {
          throw new Error(`No handler found for message type: ${type}`);
        }

        await handler(req);
      })
    );
    return;
  }

  const apiEvent = event as LambdaFunctionURLEvent;

  try {
    const pathParts = apiEvent.rawPath.split("/").filter((part) => part !== "");

    const apiName = pathParts.includes("api")
      ? pathParts[pathParts.indexOf("api") + 1]
      : pathParts[0];

    // console.log("Extracted API name:", apiName);
    const apiParams = apiEvent.body;

    const inCookies = (apiEvent.cookies || [])?.reduce(
      (acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );
    const outCookies = { ...inCookies };

    const apiRequest: ApiRequest = {
      headers: apiEvent.headers as Record<string, string>,
      cookies: outCookies,
    };

    const api = await apis[apiName as keyof typeof apis];
    if (!api) {
      console.log(
        "API not found:",
        apiName,
        "Available APIs:",
        Object.keys(apis)
      );
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Not found",
          apiName,
          availableApis: Object.keys(apis),
        }),
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
        stack: error instanceof Error ? error.stack : undefined,
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
        lambdaOutCookies.push(
          `${key}=${value}; SameSite=Lax; Path=/; Max-Age=86400`
        );
      } else {
        lambdaOutCookies.push(
          `${key}=${value}; SameSite=None; Secure; Path=/; Max-Age=86400`
        );
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
