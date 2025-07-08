import { ddb } from "../__generated/db";
import { Apis } from "../apis";
import { generateId } from "../utils/uuid";
import { config } from "../config";

export const loginWithTwitter: Apis["loginWithTwitter"] = async (
  { authorizationCode, codeVerifier },
  req
) => {
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
    console.error("Twitter token exchange failed:", {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      error: await tokenResponse.text(),
    });
    return { ok: false, reason: "TWITTER_API_ERROR" };
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  const userResponse = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=id",
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
  const { id: twitterId } = userData.data;

  const { userId } = await createUserIfNotExists({ twitterId });

  const sessionId = generateId();
  await ddb.tx((tx) =>
    tx.createSessionDoc({
      id: sessionId,
      userId,
    })
  );

  req.cookies.sessionId = sessionId;

  return { ok: true };
};

async function createUserIfNotExists({
  twitterId,
}: {
  twitterId: string;
}): Promise<{ userId: string }> {
  const identity = await ddb.getIdentityDoc({
    provider: "twitter",
    providerId: twitterId,
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
          provider: "twitter",
          providerId: twitterId,
          userId,
        },
        { id: userId }
      )
  );

  return { userId };
}
