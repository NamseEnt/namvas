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

  const apiName = event.rawPath.split("/")[1];
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
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not found" }),
    };
  }
  if (!apiParams) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Bad request" }),
    };
  }
  const apiResult = await api(JSON.parse(apiParams), apiRequest);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(apiResult),
    cookies: calculateLambdaOutCookies(inCookies, outCookies),
  };
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
