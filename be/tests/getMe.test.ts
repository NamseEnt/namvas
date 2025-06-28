import { test, expect } from "bun:test";
import { getMe } from "../src/handlers/getMe";

test("getMe handler - success response", async () => {
  const result = await getMe({});
  
  expect(result).toMatchObject({
    ok: true,
    tosAgreed: expect.any(Boolean),
  });
});

test("getMe handler - type safety", async () => {
  const result = await getMe({});
  
  if (result.ok) {
    expect(typeof result.tosAgreed).toBe("boolean");
  } else {
    expect(result.reason).toBe("NOT_LOGGED_IN");
  }
});

test("getMe handler - returns tosAgreed false by default", async () => {
  const result = await getMe({});
  
  if (result.ok) {
    expect(result.tosAgreed).toBe(false);
  }
});