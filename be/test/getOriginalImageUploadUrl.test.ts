import { apis } from "../src/apis";
import { ApiRequest } from "../src/types";
import { s3 } from "../src/s3";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

// Mock process.env
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.AWS_REGION = "us-east-1";

// Mock s3 module like how ddb is mocked in other tests - do this before describe
s3.getPresignedUploadUrl = () =>
  Promise.resolve("https://test-bucket.s3.amazonaws.com/mock-presigned-url");

describe("getOriginalImageUploadUrl", () => {
  test("should return INTERNAL_ERROR when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.getOriginalImageUploadUrl(
      { contentLength: 1000000 },
      req
    );

    expect(result).toEqual({ ok: false, reason: "INTERNAL_ERROR" });
  });

  test("should return FILE_TOO_LARGE when file size exceeds limit", async () => {
    setLoggedIn("user-123", "session-123");

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.getOriginalImageUploadUrl(
      { contentLength: 25 * 1024 * 1024 }, // 25MB, exceeds 20MB limit
      req
    );

    expect(result).toEqual({ ok: false, reason: "FILE_TOO_LARGE" });
  });

  test("should return upload URL and imageId for valid request", async () => {
    setLoggedIn("user-123", "session-123");

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.getOriginalImageUploadUrl(
      { contentLength: 5 * 1024 * 1024 }, // 5MB
      req
    );

    expect(result).toMatchObject({
      ok: true,
      uploadUrl: "https://test-bucket.s3.amazonaws.com/mock-presigned-url",
    });
  });

  test("should handle S3 errors gracefully", async () => {
    setLoggedIn("user-123", "session-123");

    // Make s3 throw an error
    s3.getPresignedUploadUrl = async () => {
      throw new Error("S3 Error");
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.getOriginalImageUploadUrl(
      { contentLength: 1000000 },
      req
    );

    expect(result).toEqual({ ok: false, reason: "INTERNAL_ERROR" });
  });
});
