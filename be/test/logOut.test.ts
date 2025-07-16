import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

describe("logout", () => {
  test("should return ok when no session", async () => {
    ddb.getSessionDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.logout({}, req);

    expect(result).toEqual({ ok: true });
  });

  test("should delete session and clear cookie when session exists", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.deleteSessionDoc = () => Promise.resolve();

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.logout({}, req);

    expect(result).toEqual({ ok: true });
    expect(req.cookies.sessionId).toBeUndefined();
  });
});
