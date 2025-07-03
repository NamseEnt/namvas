import { ddb } from "../__generated/db";
import { Apis } from "../apis";
import { generateId } from "../utils/uuid";
import { config } from "../config";

export const loginWithTwitter: Apis["loginWithTwitter"] = async (
  { authorizationCode, codeVerifier },
  req
) => {
  try {
    console.log("loginWithTwitter called with:", {
      authorizationCode,
      codeVerifierLength: codeVerifier?.length,
      config: {
        TWITTER_CLIENT_ID: config.TWITTER_CLIENT_ID,
        TWITTER_REDIRECT_URI: config.TWITTER_REDIRECT_URI,
        has_TWITTER_CLIENT_SECRET: !!config.TWITTER_CLIENT_SECRET,
      },
    });

    // Exchange authorization code for access token using PKCE
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${config.TWITTER_CLIENT_ID}:${config.TWITTER_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        client_id: config.TWITTER_CLIENT_ID!,
        code: authorizationCode,
        grant_type: "authorization_code",
        redirect_uri: config.TWITTER_REDIRECT_URI!,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Twitter token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        requestData: {
          client_id: config.TWITTER_CLIENT_ID,
          redirect_uri: config.TWITTER_REDIRECT_URI,
          has_secret: !!config.TWITTER_CLIENT_SECRET,
        },
      });
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
    console.log('Twitter user data:', userData);
    const { id: twitterId, name, username } = userData.data;
    
    // Log provider ID for admin setup
    console.log('🔐 Twitter Provider ID for admin setup:', `twitter:${twitterId}`);

    // Check if user exists
    const identity = await ddb.getIdentity({
      provider: "twitter",
      providerId: twitterId,
    });
    let userId = identity?.userId;
    if (!userId) {
      userId = generateId();
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
    const sessionId = generateId();
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