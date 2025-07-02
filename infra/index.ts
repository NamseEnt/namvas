import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const domainName = config.get("domainName") || process.env.DOMAIN_NAME; // Optional: set via config or env

// Create S3 bucket for frontend hosting
const frontendBucket = new aws.s3.BucketV2("frontend-bucket", {
  bucket: "namvas-frontend",
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
  rangeKey: "$k",
  attributes: [
    { name: "$p", type: "S" },
    { name: "$k", type: "S" },
  ],
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

// IAM policy for Lambda to access DynamoDB
const lambdaPolicy = new aws.iam.RolePolicy("lambda-policy", {
  role: lambdaRole.id,
  policy: pulumi.all([dynamoTable.arn]).apply(([tableArn]) =>
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
      ],
    })
  ),
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
    timeout: 30,
    architectures: ["x86_64"],
    layers: [llrtLayer.arn],
    environment: {
      variables: {
        DYNAMODB_TABLE_NAME: dynamoTable.name,
        NODE_ENV: "production",
        LAMBDA: "true",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || config.getSecret("googleClientSecret") || "",
        TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET || config.getSecret("twitterClientSecret") || "",
      },
    },
  },
  { dependsOn: [lambdaPolicy] }
);

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
  const hostedZone = pulumi.output(aws.route53.getZone({
    name: domainName,
  }));

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
export const dynamoTableName = dynamoTable.name;
export const lambdaFunctionName = lambdaFunction.name;
export const lambdaFunctionUrlEndpoint = lambdaFunctionUrl.functionUrl;
export const cloudFrontDomainName = cloudFrontDistribution.domainName;
export const cloudFrontDistributionId = cloudFrontDistribution.id;
export const sslCertificateArn = sslCertificate?.arn;
export const customDomainUrl = domainName ? `https://${domainName}` : undefined;
