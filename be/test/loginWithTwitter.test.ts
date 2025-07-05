// Mock process.env FIRST (before imports)
process.env.TWITTER_CLIENT_ID = "test-client-id";
process.env.TWITTER_CLIENT_SECRET = "test-client-secret";
process.env.TWITTER_REDIRECT_URI = "http://localhost:3000/callback";
process.env.LOCAL_DEV = "1";

import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

// Mock fetch
let mockFetchResponses: any[] = [];
globalThis.fetch = async (url: any, options?: any) => {
  const response = mockFetchResponses.shift();
  return response || { ok: false, json: async () => ({}), text: async () => "" };
};

// Mock Buffer
globalThis.Buffer = {
  from: (str: string) => ({
    toString: (encoding: string) => "mock-base64-auth",
  }),
} as any;

// Mock URLSearchParams
globalThis.URLSearchParams = class URLSearchParams {
  constructor(params: any) {}
  toString() {
    return "mock-url-search-params";
  }
} as any;

describe("loginWithTwitter", () => {
  beforeEach(() => {
    mockFetchResponses = [];
  });

  test("should return INVALID_CODE when token exchange fails", async () => {
    mockFetchResponses = [{ ok: false, json: async () => ({}), text: async () => "Invalid code" }];

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithTwitter(
      { authorizationCode: "invalid-code", codeVerifier: "test-verifier" },
      req
    );

    expect(result).toEqual({ ok: false, reason: "INVALID_CODE" });
  });

  test("should return TWITTER_API_ERROR when user info fetch fails", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }), text: async () => "" },
      { ok: false, json: async () => ({}), text: async () => "" },
    ];

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithTwitter(
      { authorizationCode: "valid-code", codeVerifier: "test-verifier" },
      req
    );

    expect(result).toEqual({ ok: false, reason: "TWITTER_API_ERROR" });
  });

  test("should create new user and session for new Twitter user", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }), text: async () => "" },
      {
        ok: true,
        json: async () => ({
          data: {
            id: "twitter-123",
            name: "Test User",
            username: "testuser",
          },
        }),
        text: async () => ""
      },
    ];

    ddb.getIdentity = () => Promise.resolve(undefined);
    ddb.putUser = () => Promise.resolve();
    ddb.putIdentity = () => Promise.resolve();
    ddb.putSession = () => Promise.resolve();

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithTwitter(
      { authorizationCode: "valid-code", codeVerifier: "test-verifier" },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(req.cookies.sessionId).toBeTruthy();
  });

  test("should create session for existing Twitter user", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }), text: async () => "" },
      {
        ok: true,
        json: async () => ({
          data: {
            id: "twitter-123",
            name: "Test User",
            username: "testuser",
          },
        }),
        text: async () => ""
      },
    ];

    ddb.getIdentity = () =>
      Promise.resolve({
        userId: "existing-user-123",
        provider: "twitter",
        providerId: "twitter-123",
      });
    ddb.putSession = () => Promise.resolve();

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithTwitter(
      { authorizationCode: "valid-code", codeVerifier: "test-verifier" },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(req.cookies.sessionId).toBeTruthy();
  });

  test("should handle Twitter API errors gracefully", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }), text: async () => "" },
      {
        ok: true,
        json: async () => {
          throw new Error("Twitter API error");
        },
        text: async () => ""
      },
    ];

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithTwitter(
      { authorizationCode: "valid-code", codeVerifier: "test-verifier" },
      req
    );

    expect(result).toEqual({ ok: false, reason: "TWITTER_API_ERROR" });
  });
});
