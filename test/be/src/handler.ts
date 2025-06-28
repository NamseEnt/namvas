import { isLocalDev } from './isLocalDev';

export async function handler(event: any, context: any) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello from LLRT with auto-build!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString(),
      environment: isLocalDev() ? 'local' : 'lambda',
    }),
  };
}