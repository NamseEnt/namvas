const localRedirectUri = "http://localhost:3002/auth/callback";
const productionRedirectUri = "https://namvas.com/auth/callback";

const redirectUri =
  process.env.LOCAL_DEV === "1" ? localRedirectUri : productionRedirectUri;

export let config = {
  GOOGLE_CLIENT_ID:
    "825743979695-5pe39r26j325f4omi4d5tieb9c55tv9m.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: redirectUri,
  TWITTER_CLIENT_ID: "VS02S0huS1lUbk1YVmJnQUt1akg6MTpjaQ",
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  TWITTER_REDIRECT_URI: redirectUri,
  NAVER_PAY_PARTNER_ID: process.env.NAVER_PAY_PARTNER_ID,
  NAVER_PAY_CLIENT_ID: process.env.NAVER_PAY_CLIENT_ID,
  NAVER_PAY_CLIENT_SECRET: process.env.NAVER_PAY_CLIENT_SECRET,
  NAVER_PAY_CHAIN_ID: process.env.NAVER_PAY_CHAIN_ID,
  DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || "main",
  QUEUE_URL:
    process.env.QUEUE_URL || "http://localhost:4566/000000000000/main-queue",
};
