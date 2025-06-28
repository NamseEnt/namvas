import type { ApiSpec } from "shared/apiSpec";
import { dbClient, putAccount, putIdentity, putSession } from "db";

// LLRT-compatible UUID generator using Web Crypto API
async function generateUUID(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  
  // Convert to hex string with dashes
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function loginWithGoogle(
  req: ApiSpec["loginWithGoogle"]["req"]
): Promise<ApiSpec["loginWithGoogle"]["res"]> {
  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: req.authorizationCode,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return { ok: false, reason: "INVALID_CODE" };
    }

    const tokens = await tokenResponse.json();
    
    // Get user info using the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('User info fetch failed:', await userInfoResponse.text());
      return { ok: false, reason: "GOOGLE_API_ERROR" };
    }

    const userInfo = await userInfoResponse.json();
    const googleUserId = userInfo.id;
    const email = userInfo.email;
    const name = userInfo.name;
    const picture = userInfo.picture;

    // Query for existing identity with provider and providerId
    const existingIdentityResult = await dbClient.query({
      TableName: 'main',
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `identity/provider=google/providerId=${googleUserId}`
      }
    });

    let accountId: string;
    
    if (!existingIdentityResult.Items || existingIdentityResult.Items.length === 0) {
      accountId = await generateUUID();
      const now = new Date().toISOString();
      
      await putAccount({
        id: accountId,
        createdAt: now,
        updatedAt: now,
      });
      
      const identityId = await generateUUID();
      await putIdentity({
        id: identityId,
        accountId,
        provider: "google",
        providerId: googleUserId,
        email,
        name,
        profileImageUrl: picture,
        createdAt: now,
        updatedAt: now,
      });
      
      // Also store with composite key for querying
      await dbClient.put({
        TableName: 'main',
        Item: {
          $p: `identity/provider=google/providerId=${googleUserId}`,
          $s: '_',
          identityId
        }
      });
    } else {
      const identityId = existingIdentityResult.Items[0].identityId;
      const identityResult = await dbClient.get({
        TableName: 'main',
        Key: {
          $p: `identity/id=${identityId}`,
          $s: '_'
        }
      });
      accountId = identityResult.Item.accountId;
    }

    const sessionId = await generateUUID();
    await putSession({
      id: sessionId,
      userId: accountId,
    });

    return { ok: true };
  } catch (error) {
    console.error("Google login error:", error);
    return { ok: false, reason: "GOOGLE_API_ERROR" };
  }
}