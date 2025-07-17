import { isLocalDev } from "./isLocalDev";

const localRedirectUri = "http://localhost:3002/auth/callback";
const productionRedirectUri = "https://namvas.com/auth/callback";

const redirectUri =
  process.env.LOCAL_DEV === "1" ? localRedirectUri : productionRedirectUri;

export const s3ClientConfig = isLocalDev()
  ? {
      endpoint: process.env.AWS_ENDPOINT_URL || "http://localhost:4566",
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
      forcePathStyle: true,
    }
  : {};

export let config = {
  GOOGLE_CLIENT_ID:
    "825743979695-5pe39r26j325f4omi4d5tieb9c55tv9m.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: ensureEnv("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: redirectUri,
  TWITTER_CLIENT_ID: "VS02S0huS1lUbk1YVmJnQUt1akg6MTpjaQ",
  TWITTER_CLIENT_SECRET: ensureEnv("TWITTER_CLIENT_SECRET"),
  TWITTER_REDIRECT_URI: redirectUri,
  NAVER_PAY_PARTNER_ID: ensureEnv("NAVER_PAY_PARTNER_ID"),
  NAVER_PAY_CLIENT_ID: ensureEnv("NAVER_PAY_CLIENT_ID"),
  NAVER_PAY_CLIENT_SECRET: ensureEnv("NAVER_PAY_CLIENT_SECRET"),
  NAVER_PAY_CHAIN_ID: ensureEnv("NAVER_PAY_CHAIN_ID"),
  NAVER_PAY_API_URL: ensureEnv("NAVER_PAY_API_URL"),
  DYNAMODB_TABLE_NAME: ensureEnv("DYNAMODB_TABLE_NAME") || "main",
  QUEUE_URL: ensureEnv("QUEUE_URL"),
  PAGINATION_ENCRYPTION_KEY: ensureEnv("PAGINATION_ENCRYPTION_KEY"),
};

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}
