import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

describe("getMe", () => {
  test("should return NOT_LOGGED_IN when no session", async () => {
    ddb.getSessionDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.getMe({}, req);

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return NOT_LOGGED_IN when user not found", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getUserDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.getMe({}, req);

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return user data when logged in", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getUserDoc = () =>
      Promise.resolve({
        id: "user123",
        createdAt: "2023-01-01",
        tosAgreed: true,
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.getMe({}, req);

    expect(result).toEqual({ ok: true, tosAgreed: true });
  });
});
