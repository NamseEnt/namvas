# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Install express for docker server
RUN npm install express @types/express

# Copy source code
COPY . .

# Build the application
RUN npm run build:lambda

# Create express server that wraps Lambda handler
RUN cat > docker-server.mjs << 'EOF'
import express from 'express';
import { handler } from './dist/entry/handler.js';

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Handle all API routes
app.all('/api/*', async (req, res) => {
  try {
    const event = {
      requestContext: {
        http: {
          method: req.method,
        },
      },
      rawPath: req.path,
      rawQueryString: new URLSearchParams(req.query).toString(),
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      isBase64Encoded: false,
    };

    const result = await handler(event);
    
    if (result) {
      res.status(result.statusCode || 200);
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      res.send(result.body);
    } else {
      res.status(200).send('OK');
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
EOF

# Expose port
EXPOSE 8080

# Start the express server
CMD ["node", "docker-server.mjs"]