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

export async function loginWithTwitter(
  req: ApiSpec["loginWithTwitter"]["req"]
): Promise<ApiSpec["loginWithTwitter"]["res"]> {
  try {
    // Exchange authorization code for tokens using Twitter OAuth 2.0 with PKCE
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: req.authorizationCode,
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: process.env.TWITTER_REDIRECT_URI!,
        grant_type: 'authorization_code',
        code_verifier: req.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Twitter token exchange failed:', await tokenResponse.text());
      return { ok: false, reason: "INVALID_CODE" };
    }

    const tokens = await tokenResponse.json();
    
    // Get user info using the access token
    const userInfoResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Twitter user info fetch failed:', await userInfoResponse.text());
      return { ok: false, reason: "TWITTER_API_ERROR" };
    }

    const userInfo = await userInfoResponse.json();
    const twitterUserId = userInfo.data.id;
    const name = userInfo.data.name;
    const username = userInfo.data.username;
    const profileImageUrl = userInfo.data.profile_image_url;

    // Query for existing identity with provider and providerId
    const existingIdentityResult = await dbClient.query({
      TableName: 'main',
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `identity/provider=twitter/providerId=${twitterUserId}`
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
        provider: "twitter",
        providerId: twitterUserId,
        email: null, // Twitter OAuth 2.0 doesn't provide email by default
        name,
        username,
        profileImageUrl,
        createdAt: now,
        updatedAt: now,
      });
      
      // Also store with composite key for querying
      await dbClient.put({
        TableName: 'main',
        Item: {
          $p: `identity/provider=twitter/providerId=${twitterUserId}`,
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
    console.error("Twitter login error:", error);
    return { ok: false, reason: "TWITTER_API_ERROR" };
  }
}