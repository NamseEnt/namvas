import { ddb } from "../__generated/db";
import { Apis } from "../apis";
import { generateId } from "../utils/uuid";

export const loginWithGoogle: Apis["loginWithGoogle"] = async (
  { authorizationCode },
  req
) => {
  try {
    console.log("loginWithGoogle called with code:", authorizationCode);
    console.log("Environment check:", {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      has_GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    });
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID || '')}&client_secret=${encodeURIComponent(process.env.GOOGLE_CLIENT_SECRET || '')}&code=${encodeURIComponent(authorizationCode)}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '')}`,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Google token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        env: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          has_secret: !!process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        }
      });
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
    console.log('Google user data:', userData);
    const { id: googleId, email, name } = userData;
    
    // Log provider ID for admin setup
    console.log('🔐 Google Provider ID for admin setup:', `google:${googleId}`);

    // Check if user exists
    const identity = await ddb.getIdentityDoc({
      provider: "google",
      providerId: googleId,
    });
    let userId = identity?.userId;
    if (!userId) {
      userId = generateId();
      await ddb.tx(tx => 
        tx.createUserDoc({
          id: userId,
          tosAgreed: false,
          createdAt: new Date().toISOString(),
        })
        .createIdentityDoc({
          provider: "google",
          providerId: googleId,
          userId,
        })
      );
    }

    // Create session
    const sessionId = generateId();
    await ddb.tx(tx => tx.createSessionDoc({
      id: sessionId,
      userId,
    }));

    // Set session cookie
    req.cookies.sessionId = sessionId;

    return { ok: true };
  } catch (error) {
    console.error("Google login error:", error);
    return { ok: false, reason: "GOOGLE_API_ERROR" };
  }
};
