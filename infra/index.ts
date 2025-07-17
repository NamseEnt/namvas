import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const domainName = config.get("domainName") || process.env.DOMAIN_NAME; // Optional: set via config or env

// Create S3 bucket for frontend hosting
const frontendBucket = new aws.s3.BucketV2("frontend-bucket", {
  bucketPrefix: "namvas-frontend-",
});

// Create S3 bucket for image storage
const imageBucket = new aws.s3.BucketV2("image-bucket", {
  bucketPrefix: "namvas-images-",
});

// Create S3 bucket for binary assets
const binaryAssetsBucket = new aws.s3.BucketV2("binary-assets-bucket", {
  bucketPrefix: "namvas-binary-assets-",
});

// Configure S3 bucket for static website hosting
const frontendBucketWebsite = new aws.s3.BucketWebsiteConfigurationV2(
  "frontend-bucket-website",
  {
    bucket: frontendBucket.bucket,
    indexDocument: {
      suffix: "index.html",
    },
    errorDocument: {
      key: "index.html", // SPA routing fallback
    },
  }
);

// S3 bucket public access block (we'll allow public read for website)
const frontendBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "frontend-bucket-pab",
  {
    bucket: frontendBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }
);

// S3 bucket policy for public read access
new aws.s3.BucketPolicy(
  "frontend-bucket-policy",
  {
    bucket: frontendBucket.id,
    policy: pulumi.all([frontendBucket.arn]).apply(([bucketArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `${bucketArn}/*`,
          },
        ],
      })
    ),
  },
  { dependsOn: [frontendBucketPublicAccessBlock] }
);

// DynamoDB table for application data
const dynamoTable = new aws.dynamodb.Table("app-table", {
  name: "namvas-app",
  billingMode: "PAY_PER_REQUEST",
  hashKey: "$p",
  rangeKey: "$s",
  attributes: [
    { name: "$p", type: "S" },
    { name: "$s", type: "S" },
  ],
});

// SQS Dead Letter Queue for all async processing
const mainDlq = new aws.sqs.Queue("main-dlq", {
  name: "main-dlq",
  messageRetentionSeconds: 1209600, // 14 days
});

// SQS Queue for all async processing (공용 큐)
const mainQueue = new aws.sqs.Queue("main-queue", {
  name: "main-queue",
  visibilityTimeoutSeconds: 300, // 5 minutes
  messageRetentionSeconds: 1209600, // 14 days
  redrivePolicy: pulumi.jsonStringify({
    deadLetterTargetArn: mainDlq.arn,
    maxReceiveCount: 3,
  }),
});

// IAM role for Lambda
const lambdaRole = new aws.iam.Role("lambda-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
      },
    ],
  }),
});

// IAM policy for Lambda to access DynamoDB, SQS, and S3
const lambdaPolicy = new aws.iam.RolePolicy("lambda-policy", {
  role: lambdaRole.id,
  policy: pulumi
    .all([
      dynamoTable.arn,
      mainQueue.arn,
      mainDlq.arn,
      imageBucket.arn,
      binaryAssetsBucket.arn,
    ])
    .apply(
      ([tableArn, queueArn, dlqArn, imageBucketArn, binaryAssetsBucketArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              Resource: "arn:aws:logs:*:*:*",
            },
            {
              Effect: "Allow",
              Action: [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
              ],
              Resource: [tableArn, `${tableArn}/index/*`],
            },
            {
              Effect: "Allow",
              Action: [
                "sqs:SendMessage",
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:GetQueueAttributes",
              ],
              Resource: [queueArn, dlqArn],
            },
            {
              Effect: "Allow",
              Action: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectAcl",
                "s3:PutObjectAcl",
              ],
              Resource: [`${imageBucketArn}/*`, `${binaryAssetsBucketArn}/*`],
            },
          ],
        })
    ),
});

// EventBridge Scheduler IAM Role
const schedulerRole = new aws.iam.Role("scheduler-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "scheduler.amazonaws.com",
        },
      },
    ],
  }),
});

// Upload ImageMagick binaries for both platforms
const imagemagickArm64Object = new aws.s3.BucketObjectv2("imagemagick-arm64-object", {
  bucket: binaryAssetsBucket.bucket,
  key: "imagemagick-arm64.tar.zst",
  source: new pulumi.asset.FileAsset("../im/imagemagick-arm64.tar.zst"),
  contentType: "application/zstd",
});

const imagemagickX64Object = new aws.s3.BucketObjectv2("imagemagick-x64-object", {
  bucket: binaryAssetsBucket.bucket,
  key: "imagemagick-x64.tar.zst",
  source: new pulumi.asset.FileAsset("../im/imagemagick-x64.tar.zst"),
  contentType: "application/zstd",
});

// LLRT Layer
const llrtLayer = new aws.lambda.LayerVersion("llrt-layer", {
  layerName: "llrt-layer",
  code: new pulumi.asset.FileArchive("llrt-lambda-x64.zip"),
  compatibleRuntimes: ["provided.al2023"],
  compatibleArchitectures: ["x86_64"],
});

// Lambda function for backend (LLRT)
const lambdaFunction = new aws.lambda.Function(
  "backend-lambda",
  {
    code: new pulumi.asset.FileArchive("../be/dist"),
    handler: "lambda-entry.handler",
    runtime: "provided.al2023",
    role: lambdaRole.arn,
    timeout: 300, // 5 minutes for both API and SQS processing
    architectures: ["x86_64"],
    layers: [llrtLayer.arn],
    environment: {
      variables: {
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        QUEUE_URL: mainQueue.url,
        S3_BUCKET_NAME: imageBucket.bucket,
        BINARY_ASSETS_BUCKET_NAME: binaryAssetsBucket.bucket,
        NODE_ENV: "production",
        LAMBDA: "true",
        GOOGLE_CLIENT_ID:
          "825743979695-5pe39r26j325f4omi4d5tieb9c55tv9m.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET:
          process.env.GOOGLE_CLIENT_SECRET ||
          config.getSecret("googleClientSecret") ||
          "",
        GOOGLE_REDIRECT_URI: "https://namvas.com/auth/callback",
        TWITTER_CLIENT_ID: "VS02S0huS1lUbk1YVmJnQUt1akg6MTpjaQ",
        TWITTER_CLIENT_SECRET:
          process.env.TWITTER_CLIENT_SECRET ||
          config.getSecret("twitterClientSecret") ||
          "",
        TWITTER_REDIRECT_URI: "https://namvas.com/auth/callback",
      },
    },
  },
  { dependsOn: [lambdaPolicy] }
);

// SQS Event Source Mapping - 기존 Lambda가 공용 큐 처리
new aws.lambda.EventSourceMapping("queue-processor-sqs-trigger", {
  eventSourceArn: mainQueue.arn,
  functionName: lambdaFunction.name, // 기존 Lambda 사용
  batchSize: 1, // Process one message at a time
  maximumBatchingWindowInSeconds: 5,
});

// Dead Letter Queue Event Source Mapping for manual processing
new aws.lambda.EventSourceMapping("queue-processor-dlq-trigger", {
  eventSourceArn: mainDlq.arn,
  functionName: lambdaFunction.name, // 기존 Lambda 사용
  batchSize: 1,
  maximumBatchingWindowInSeconds: 5,
});

// Lambda Function URL
const lambdaFunctionUrl = new aws.lambda.FunctionUrl("backend-lambda-url", {
  functionName: lambdaFunction.name,
  authorizationType: "NONE",
  cors: {
    allowCredentials: true,
    allowOrigins: ["*"],
    allowMethods: ["*"],
    allowHeaders: ["date", "keep-alive", "content-type"],
    exposeHeaders: ["date", "keep-alive"],
    maxAge: 86400,
  },
});

// EventBridge Scheduler Policy
const schedulerPolicy = new aws.iam.RolePolicy("scheduler-policy", {
  role: schedulerRole.id,
  policy: pulumi.all([lambdaFunction.arn]).apply(([lambdaArn]) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["lambda:InvokeFunction"],
          Resource: lambdaArn,
        },
      ],
    })
  ),
});

// EventBridge Scheduler Group
const schedulerGroup = new aws.scheduler.ScheduleGroup(
  "payment-scheduler-group",
  {
    name: "payment-scheduler-group",
  }
);

// EventBridge Scheduler
const verifyPaymentsScheduler = new aws.scheduler.Schedule(
  "verify-payments-scheduler",
  {
    name: "verify-payments-scheduler",
    groupName: schedulerGroup.name,
    scheduleExpression: "rate(10 seconds)",
    target: {
      arn: lambdaFunction.arn,
      roleArn: schedulerRole.arn,
      input: JSON.stringify({
        from: "eventBridgeScheduler",
        type: "verifyPayments",
        body: JSON.stringify({}),
      }),
    },
    flexibleTimeWindow: {
      mode: "OFF",
    },
  },
  { dependsOn: [schedulerPolicy] }
);

// SSL Certificate (if domain is provided)
let sslCertificate: aws.acm.Certificate | undefined;
if (domainName) {
  sslCertificate = new aws.acm.Certificate(
    "ssl-certificate",
    {
      domainName: domainName,
      validationMethod: "DNS",
    },
    { provider: new aws.Provider("us-east-1", { region: "us-east-1" }) }
  ); // CloudFront requires us-east-1
}

// CloudFront distribution for frontend
const cloudFrontDistribution = new aws.cloudfront.Distribution(
  "frontend-distribution",
  {
    aliases: domainName ? [domainName] : undefined,
    origins: [
      {
        domainName: frontendBucketWebsite.websiteEndpoint.apply((endpoint) =>
          endpoint.replace("http://", "")
        ),
        originId: "S3-frontend",
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: "http-only",
          originSslProtocols: ["TLSv1.2"],
        },
      },
    ],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
      allowedMethods: [
        "DELETE",
        "GET",
        "HEAD",
        "OPTIONS",
        "PATCH",
        "POST",
        "PUT",
      ],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: "S3-frontend",
      forwardedValues: {
        queryString: false,
        cookies: { forward: "none" },
      },
      viewerProtocolPolicy: "redirect-to-https",
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400,
    },
    customErrorResponses: [
      {
        errorCode: 404,
        responseCode: 200,
        responsePagePath: "/index.html", // SPA routing fallback
      },
    ],
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    viewerCertificate: sslCertificate
      ? {
          acmCertificateArn: sslCertificate.arn,
          sslSupportMethod: "sni-only",
          minimumProtocolVersion: "TLSv1.2_2021",
        }
      : {
          cloudfrontDefaultCertificate: true,
        },
  }
);

// Route53 records (if domain is configured and in same account)
if (domainName) {
  // Get the hosted zone
  const hostedZone = pulumi.output(
    aws.route53.getZone({
      name: domainName,
    })
  );

  // Create A record for root domain
  new aws.route53.Record("domain-a-record", {
    zoneId: hostedZone.apply((zone) => zone.zoneId),
    name: domainName,
    type: "A",
    aliases: [
      {
        name: cloudFrontDistribution.domainName,
        zoneId: cloudFrontDistribution.hostedZoneId,
        evaluateTargetHealth: false,
      },
    ],
  });
}

// Exports
export const frontendBucketName = frontendBucket.id;
export const frontendBucketWebsiteUrl = frontendBucketWebsite.websiteEndpoint;
export const imageBucketName = imageBucket.id;
export const binaryAssetsBucketName = binaryAssetsBucket.id;
export const imagemagickArm64ObjectKey = imagemagickArm64Object.key;
export const imagemagickX64ObjectKey = imagemagickX64Object.key;
export const imagemagickArm64ObjectUrl = pulumi.interpolate`https://${binaryAssetsBucket.bucket}.s3.${binaryAssetsBucket.region}.amazonaws.com/${imagemagickArm64Object.key}`;
export const imagemagickX64ObjectUrl = pulumi.interpolate`https://${binaryAssetsBucket.bucket}.s3.${binaryAssetsBucket.region}.amazonaws.com/${imagemagickX64Object.key}`;
export const dynamoTableName = dynamoTable.name;
export const lambdaFunctionName = lambdaFunction.name;
export const lambdaFunctionUrlEndpoint = lambdaFunctionUrl.functionUrl;
export const mainQueueUrl = mainQueue.url;
export const mainQueueArn = mainQueue.arn;
export const mainDlqUrl = mainDlq.url;
export const mainDlqArn = mainDlq.arn;
export const cloudFrontDomainName = cloudFrontDistribution.domainName;
export const cloudFrontDistributionId = cloudFrontDistribution.id;
export const sslCertificateArn = sslCertificate?.arn;
export const customDomainUrl = domainName ? `https://${domainName}` : undefined;
