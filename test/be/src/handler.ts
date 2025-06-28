import { isLocalDev } from "./isLocalDev";
import type {
  APIGatewayProxyStructuredResultV2,
  LambdaFunctionURLEvent,
} from "aws-lambda";

export async function handler(
  event: LambdaFunctionURLEvent
): Promise<APIGatewayProxyStructuredResultV2> {
  console.log("Received event:", JSON.stringify(event, null, 2));

  if (
    event.requestContext.http.method === "POST" &&
    event.rawPath === "/s3-test"
  ) {
    try {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "S3 test completed",
          environment: isLocalDev() ? "local" : "lambda",
        }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello from LLRT with auto-build!",
      path: event.rawPath,
      method: event.requestContext.http.method,
      timestamp: new Date().toISOString(),
      environment: isLocalDev() ? "local" : "lambda",
      s3TestEndpoint: "POST /s3-test",
    }),
  };
}
