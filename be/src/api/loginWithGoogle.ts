import { ddb } from "../__generated/db";
import { Apis } from "../apis";
import { config } from "../config";
import { generateId } from "../utils/uuid";

export const loginWithGoogle: Apis["loginWithGoogle"] = async (
  { authorizationCode },
  req
) => {
  const googleClientId = config.GOOGLE_CLIENT_ID;
  const googleClientSecret = config.GOOGLE_CLIENT_SECRET;
  const googleRedirectUri = config.GOOGLE_REDIRECT_URI;
  if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
    throw new Error("ENVIRONTMENT_VARIABLE_NOT_SET");
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
      redirect_uri: googleRedirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    console.error("Google token exchange failed:", {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      error: await tokenResponse.text(),
      env: {
        client_id: googleClientId,
        has_secret: !!googleClientSecret,
        redirect_uri: googleRedirectUri,
      },
    });
    return { ok: false, reason: "GOOGLE_API_ERROR" };
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

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
  const { id: googleId } = userData;

  const { userId } = await createUserIfNotExists({ googleId });

  const sessionId = generateId();
  await ddb.tx((tx) =>
    tx.createSessionDoc({
      id: sessionId,
      userId,
    })
  );

  // Set session cookie
  req.cookies.sessionId = sessionId;

  return { ok: true };
};

async function createUserIfNotExists({
  googleId,
}: {
  googleId: string;
}): Promise<{ userId: string }> {
  const identity = await ddb.getIdentityDoc({
    provider: "google",
    providerId: googleId,
  });
  if (identity) {
    return { userId: identity.userId };
  }

  const userId = generateId();
  await ddb.tx((tx) =>
    tx
      .createUserDoc({
        id: userId,
        tosAgreed: false,
        createdAt: new Date().toISOString(),
      })
      .createIdentityDoc(
        {
          provider: "google",
          providerId: googleId,
          userId,
        },
        { id: userId }
      )
  );

  return { userId };
}
