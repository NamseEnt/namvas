import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

describe("getMe", () => {
  test("should return NOT_LOGGED_IN when no session", async () => {
    ddb.getSession = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.getMe({}, req);

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return NOT_LOGGED_IN when user not found", async () => {
    ddb.getSession = () =>
      Promise.resolve({ userId: "user123", id: "session123" });
    ddb.getUser = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.getMe({}, req);

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return user data when logged in", async () => {
    ddb.getSession = () =>
      Promise.resolve({ userId: "user123", id: "session123" });
    ddb.getUser = () =>
      Promise.resolve({
        id: "user123",
        createdAt: "2023-01-01",
        tosAgreed: true,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.getMe({}, req);

    expect(result).toEqual({ ok: true, tosAgreed: true });
  });
});
