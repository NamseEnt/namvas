import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

// Mock fetch
let mockFetchResponses: any[] = [];
globalThis.fetch = async (url: any, options?: any) => {
  const response = mockFetchResponses.shift();
  return response || { ok: false, json: async () => ({}) };
};

// Mock crypto
globalThis.crypto = {
  randomUUID: () => "mock-uuid-123",
} as any;

// Mock process.env
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/callback";

describe("loginWithGoogle", () => {
  beforeEach(() => {
    mockFetchResponses = [];
  });

  test("should return INVALID_CODE when token exchange fails", async () => {
    mockFetchResponses = [{ ok: false, json: async () => ({}) }];

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithGoogle(
      { authorizationCode: "invalid-code" },
      req
    );

    expect(result).toEqual({ ok: false, reason: "INVALID_CODE" });
  });

  test("should return GOOGLE_API_ERROR when user info fetch fails", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }) },
      { ok: false, json: async () => ({}) },
    ];

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithGoogle(
      { authorizationCode: "valid-code" },
      req
    );

    expect(result).toEqual({ ok: false, reason: "GOOGLE_API_ERROR" });
  });

  test("should create new user and session for new Google user", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }) },
      {
        ok: true,
        json: async () => ({
          id: "google-123",
          email: "test@example.com",
          name: "Test User",
        }),
      },
    ];

    ddb.getIdentity = () => Promise.resolve(undefined);
    ddb.putUser = () => Promise.resolve();
    ddb.putIdentity = () => Promise.resolve();
    ddb.putSession = () => Promise.resolve();

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithGoogle(
      { authorizationCode: "valid-code" },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(req.cookies.sessionId).toBe("mock-uuid-123");
  });

  test("should create session for existing Google user", async () => {
    mockFetchResponses = [
      { ok: true, json: async () => ({ access_token: "mock-access-token" }) },
      {
        ok: true,
        json: async () => ({
          id: "google-123",
          email: "test@example.com",
          name: "Test User",
        }),
      },
    ];

    ddb.getIdentity = () =>
      Promise.resolve({
        userId: "existing-user-123",
        provider: "google",
        providerId: "google-123",
      });
    ddb.putSession = () => Promise.resolve();

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.loginWithGoogle(
      { authorizationCode: "valid-code" },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(req.cookies.sessionId).toBe("mock-uuid-123");
  });
});
