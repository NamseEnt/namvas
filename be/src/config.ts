const localRedirectUri = "http://localhost:3002/auth/callback";
const productionRedirectUri = "https://namvas.com/auth/callback";


const redirectUri =
  process.env.LOCAL_DEV === "1"
    ? localRedirectUri
    : productionRedirectUri;

export const config = {
  GOOGLE_CLIENT_ID:
    "825743979695-5pe39r26j325f4omi4d5tieb9c55tv9m.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: redirectUri,
  TWITTER_CLIENT_ID: "VS02S0huS1lUbk1YVmJnQUt1akg6MTpjaQ",
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  TWITTER_REDIRECT_URI: redirectUri,
  DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || "main",
  region: process.env.AWS_REGION || "us-east-1",
  queueUrl: process.env.QUEUE_URL || 
    (process.env.LOCAL_DEV === "1" ? "http://localhost:4566/000000000000/main-queue" : ""),
  localstack: process.env.LOCAL_DEV === "1" ? {
    endpoint: process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566",
  } : undefined,
};
