import { handler } from './handler';

const PORT = process.env.PORT || 3000;
const emulatorUrl = `http://localhost:${PORT}`;

async function main() {
  try {
    const requestResponse = await fetch(`${emulatorUrl}/__emulator/request`);

    if (!requestResponse.ok) {
      throw new Error(`Failed to get request: ${requestResponse.statusText}`);
    }

    const requestData = await requestResponse.json();

    const event = {
      httpMethod: requestData.method,
      path: new URL(requestData.url).pathname,
      queryStringParameters: Object.fromEntries(new URL(requestData.url).searchParams.entries()),
      headers: requestData.headers,
      body: requestData.body,
      isBase64Encoded: false,
    };

    const result = await handler(event, {});

    const response = {
      status: result.statusCode || 200,
      headers: result.headers || {},
      body: result.body || '',
    };

    await fetch(`${emulatorUrl}/__emulator/response`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(response),
    });

  } catch (error) {
    console.error('Error processing request:', error);
    
    await fetch(`${emulatorUrl}/__emulator/response`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        status: 500,
        headers: { 'content-type': 'text/plain' },
        body: 'Internal Server Error',
      }),
    });
  }
}

main();