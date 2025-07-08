import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

describe("newArtwork", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.newArtwork(
      {
        title: "Test Artwork",
        artwork: {
          originalImageId: "image123",
          dpi: 300,
          imageCenterXy: { x: 0.5, y: 0.5 },
          sideProcessing: { type: "none" },
        },
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should create artwork successfully", async () => {
    setLoggedIn("user-123", "session-123");

    let txCalled = false;
    let createdArtwork: any;
    ddb.tx = (callback: any) => {
      txCalled = true;
      const mockTx = {
        createArtworkDoc: (artworkDoc: any, ownerRef: any) => {
          createdArtwork = artworkDoc;
          expect(ownerRef).toEqual({ id: "user-123" });
          return mockTx;
        },
      };
      callback(mockTx);
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.newArtwork(
      {
        title: "My Test Artwork",
        artwork: {
          originalImageId: "image456",
          dpi: 600,
          imageCenterXy: { x: 0.3, y: 0.7 },
          sideProcessing: { type: "clip" },
        },
      },
      req
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artworkId).toBeDefined();
      expect(typeof result.artworkId).toBe("string");
    }
    expect(txCalled).toBe(true);
    expect(createdArtwork).toMatchObject({
      ownerId: "user-123",
      title: "My Test Artwork",
      originalImageId: "image456",
      dpi: 600,
      imageCenterXy: { x: 0.3, y: 0.7 },
      sideProcessing: { type: "clip" },
    });
    expect(createdArtwork.id).toBeDefined();
  });
});