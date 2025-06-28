import { test, expect } from "../src/utils/test-runner";
import { getMe } from "../src/handlers/getMe";

test("getMe handler - success response", async () => {
  const mockReq = { cookies: new Map() };
  const result = await getMe({}, mockReq);
  
  expect(result).toMatchObject({
    ok: true,
    tosAgreed: expect.any(Boolean),
  });
});

test("getMe handler - type safety", async () => {
  const mockReq = { cookies: new Map() };
  const result = await getMe({}, mockReq);
  
  if (result.ok) {
    expect(typeof result.tosAgreed).toBe("boolean");
  } else {
    expect(result.reason).toBe("NOT_LOGGED_IN");
  }
});

test("getMe handler - returns tosAgreed false by default", async () => {
  const mockReq = { cookies: new Map() };
  const result = await getMe({}, mockReq);
  
  if (result.ok) {
    expect(result.tosAgreed).toBe(false);
  }
});