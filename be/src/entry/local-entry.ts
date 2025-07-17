import { handler } from "./handler";
import type {
  APIGatewayProxyStructuredResultV2,
  LambdaFunctionURLEvent,
} from "aws-lambda";

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT is not set");
}

// Docker 컨테이너에서 실행될 때는 EMULATOR_ENDPOINT 환경변수 사용
const emulatorUrl = process.env.EMULATOR_ENDPOINT || `http://localhost:${PORT}`;
const containerId = process.env.CONTAINER_ID || "unknown";
const codeVersion = process.env.CODE_VERSION || "unknown";

async function processRequest() {
  try {
    const requestResponse = await fetch(`${emulatorUrl}/__emulator/request/${containerId}?version=${codeVersion}`);

    if (!requestResponse.ok) {
      if (requestResponse.status === 404) {
        // No request available
        return false;
      }
      if (requestResponse.status === 410) {
        // Code version mismatch, exit the container
        console.log(`Code version mismatch. Container version: ${codeVersion}, shutting down...`);
        process.exit(0);
      }
      throw new Error(`Failed to get request: ${requestResponse.statusText}`);
    }

    const requestData = (await requestResponse.json()) as {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
    };


    const url = new URL(requestData.url);

    // Parse cookies from request headers
    const cookies: string[] = [];
    const cookieHeader =
      requestData.headers.cookie || requestData.headers.Cookie;
    if (cookieHeader) {
      cookies.push(...cookieHeader.split(";").map((c) => c.trim()));
    }

    const event: LambdaFunctionURLEvent = {
      version: "2.0",
      routeKey: "$default",
      rawPath: url.pathname,
      rawQueryString: url.search.slice(1),
      headers: requestData.headers,
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      cookies,
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

    const result = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    const response = {
      status: result.statusCode || 200,
      headers: result.headers || {},
      body: result.body || "",
      cookies: result.cookies || [],
    };

    await fetch(`${emulatorUrl}/__emulator/response/${containerId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(response),
    });

    return true;
  } catch (error) {

    try {
      await fetch(`${emulatorUrl}/__emulator/response/${containerId}`, {
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
    } catch (e) {
      // Ignore response errors
    }
    return true;
  }
}

async function main() {
  // 항상 Pool 모드로 실행
  
  while (true) {
    await processRequest();
    // Long polling이므로 대기 없이 바로 다음 요청
  }
}

main();
