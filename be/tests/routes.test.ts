import { test, expect } from "bun:test";
import { routes } from "../src/routes";

test("routes object contains required endpoints", () => {
  expect(routes).toHaveProperty("getMe");
  expect(typeof routes.getMe).toBe("function");
});

test("routes object keys match API spec", () => {
  const expectedEndpoints = ["getMe"];
  const actualEndpoints = Object.keys(routes);
  
  expect(actualEndpoints).toEqual(expectedEndpoints);
});