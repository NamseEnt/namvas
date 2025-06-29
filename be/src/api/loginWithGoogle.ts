import { ddb } from "db";
import { Apis } from "../apis";

export const loginWithGoogle: Apis["loginWithGoogle"] = async (
  { authorizationCode },
  req
) => {
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: authorizationCode,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      return { ok: false, reason: "INVALID_CODE" };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      return { ok: false, reason: "GOOGLE_API_ERROR" };
    }

    const userData = await userResponse.json();
    const { id: googleId, email, name } = userData;

    // Check if user exists
    const identity = await ddb.getIdentity({
      provider: "google",
      providerId: googleId,
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
        provider: "google",
        providerId: googleId,
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
    console.error("Google login error:", error);
    return { ok: false, reason: "GOOGLE_API_ERROR" };
  }
};
