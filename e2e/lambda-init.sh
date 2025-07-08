#!/bin/bash
set -e

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
until curl -f http://localstack:4566/_localstack/health; do
  sleep 2
done

echo "LocalStack is ready. Deploying Lambda function..."

# Create Lambda function from the built dist
cd /opt/code/lambda

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "Building Lambda function..."
  npm install
  # Generate database schema first
  npm run schema-gen
  # Use basic build without bun
  npx esbuild src/entry/handler.ts --bundle --platform=node --target=node20 --outdir=dist/entry --format=esm --external:@aws-sdk/*
fi

# zip is already available in alpine

# Create deployment package
echo "Creating deployment package..."
zip -r function.zip dist/

# Create IAM role (required for Lambda)
awslocal iam create-role \
  --role-name lambda-role \
  --assume-role-policy-document '{"Version": "2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' || true

# Create Lambda function
echo "Creating Lambda function..."
awslocal lambda create-function \
  --function-name namvas-api \
  --runtime nodejs20.x \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler dist/entry/handler.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{AWS_ENDPOINT_URL=http://localstack:4566,AWS_REGION=us-east-1,AWS_ACCESS_KEY_ID=test,AWS_SECRET_ACCESS_KEY=test}"

# Create API Gateway instead of Function URL due to LocalStack CORS issues
echo "Creating API Gateway..."
set +e  # Don't exit on error for API creation

# Create API Gateway
API_ID=$(awslocal apigateway create-rest-api --name namvas-api --query 'id' --output text 2>&1)
API_EXIT_CODE=$?

if [ $API_EXIT_CODE -eq 0 ]; then
  echo "✅ API Gateway created: $API_ID"
  
  # Get root resource ID
  ROOT_RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text)
  
  # Create /api resource
  API_RESOURCE_ID=$(awslocal apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part api \
    --query 'id' --output text)
  
  # Create /{proxy+} resource under /api
  PROXY_RESOURCE_ID=$(awslocal apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $API_RESOURCE_ID \
    --path-part '{proxy+}' \
    --query 'id' --output text)
  
  # Create ANY method for /{proxy+}
  awslocal apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE
  
  # Create OPTIONS method for CORS
  awslocal apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE
  
  # Set up integration with Lambda
  awslocal apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:000000000000:function:namvas-api/invocations
  
  # Set up CORS integration for OPTIONS
  awslocal apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}'
  
  # Set up method responses
  awslocal apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --status-code 200
  
  awslocal apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}'
  
  # Set up integration responses
  awslocal apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --status-code 200
  
  awslocal apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,OPTIONS,POST,PUT,DELETE'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}'
  
  # Add Lambda permission
  awslocal lambda add-permission \
    --function-name namvas-api \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:us-east-1:000000000000:$API_ID/*/*"
  
  # Deploy API
  awslocal apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod
  
  FUNCTION_URL="http://localhost:4566/restapis/$API_ID/prod/_user_request_"
  echo "✅ API Gateway deployed successfully!"
  echo "API Gateway URL: $FUNCTION_URL"
  
  sleep 3
else
  echo "❌ API Gateway creation failed:"
  echo "$API_ID"
  echo "Falling back to direct Lambda Function URL..."
  
  # Fallback to Function URL
  awslocal lambda delete-function-url-config --function-name namvas-api >/dev/null 2>&1
  
  FUNCTION_URL=$(awslocal lambda create-function-url-config \
    --function-name namvas-api \
    --cors '{"AllowOrigins":["*"],"AllowMethods":["*"],"AllowHeaders":["*"],"MaxAge": 86400}' \
    --auth-type NONE \
    --query 'FunctionUrl' --output text 2>&1)
  
  echo "Function URL: $FUNCTION_URL"
fi

set -e  # Re-enable exit on error

echo "Lambda function deployed successfully!"