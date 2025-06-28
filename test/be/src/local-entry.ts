import { handler } from "./handler";
import type { LambdaFunctionURLEvent, Context } from "aws-lambda";

const PORT = process.env.PORT || 3000;
const emulatorUrl = `http://localhost:${PORT}`;

async function main() {
  try {
    const requestResponse = await fetch(`${emulatorUrl}/__emulator/request`);

    if (!requestResponse.ok) {
      throw new Error(`Failed to get request: ${requestResponse.statusText}`);
    }

    const requestData = await requestResponse.json();

    const url = new URL(requestData.url);
    const event: LambdaFunctionURLEvent = {
      version: "2.0",
      routeKey: "$default",
      rawPath: url.pathname,
      rawQueryString: url.search.slice(1),
      headers: requestData.headers,
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      requestContext: {
        accountId: "123456789012",
        apiId: "local-emulator",
        domainName: "localhost",
        domainPrefix: "local",
        http: {
          method: requestData.method,
          path: url.pathname,
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: requestData.headers["user-agent"] || "local-emulator",
        },
        requestId: crypto.randomUUID(),
        routeKey: "$default",
        stage: "$default",
        time: new Date().toISOString(),
        timeEpoch: Date.now(),
      },
      body: requestData.body,
      isBase64Encoded: false,
    };

    const result = await handler(event);

    const response = {
      status: result.statusCode || 200,
      headers: result.headers || {},
      body: result.body || "",
    };

    await fetch(`${emulatorUrl}/__emulator/response`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(response),
    });
  } catch (error) {
    console.error("Error processing request:", error);

    await fetch(`${emulatorUrl}/__emulator/response`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        status: 500,
        headers: { "content-type": "text/plain" },
        body: "Internal Server Error",
      }),
    });
  }
}

main();
