import { apis } from "../src/apis";
import { ddb } from "db";
import { ApiRequest } from "../src/types";

describe("logOut", () => {
  test("should return ok when no session", async () => {
    ddb.getSession = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.logOut({}, req);

    expect(result).toEqual({ ok: true });
  });

  test("should delete session and clear cookie when session exists", async () => {
    ddb.getSession = () => Promise.resolve({ userId: "user123", id: "session123" });
    ddb.deleteSession = () => Promise.resolve();

    const req: ApiRequest = { 
      cookies: { sessionId: "session123" }, 
      headers: {} 
    };
    const result = await apis.logOut({}, req);

    expect(result).toEqual({ ok: true });
    expect(req.cookies.sessionId).toBeUndefined();
  });
});