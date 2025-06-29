import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const loginWithTwitter: Apis["loginWithTwitter"] = async (
  { authorizationCode, codeVerifier },
  req
) => {
  try {
    // Exchange authorization code for access token using PKCE
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        client_id: process.env.TWITTER_CLIENT_ID!,
        code: authorizationCode,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITTER_REDIRECT_URI!,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      return { ok: false, reason: "INVALID_CODE" };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Twitter
    const userResponse = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=id,name,username",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      return { ok: false, reason: "TWITTER_API_ERROR" };
    }

    const userData = await userResponse.json();
    const { id: twitterId, name, username } = userData.data;

    // Check if user exists
    const identity = await ddb.getIdentity({
      provider: "twitter",
      providerId: twitterId,
    });
    let userId = identity?.userId;
    if (!userId) {
      userId = crypto.randomUUID();
      // TODO: Transaction
      await ddb.putUser({
        id: userId,
        tosAgreed: false,
        createdAt: new Date().toISOString(),
      });
      await ddb.putIdentity({
        provider: "twitter",
        providerId: twitterId,
        userId,
      });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    await ddb.putSession({
      id: sessionId,
      userId,
    });

    // Set session cookie
    req.cookies.sessionId = sessionId;

    return { ok: true };
  } catch (error) {
    console.error("Twitter login error:", error);
    return { ok: false, reason: "TWITTER_API_ERROR" };
  }
};