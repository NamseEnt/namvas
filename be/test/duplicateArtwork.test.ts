import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

describe("duplicateArtwork", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.duplicateArtwork(
      {
        artworkId: "artwork-123",
        title: "Duplicated Artwork",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return ARTWORK_NOT_FOUND when artwork does not exist", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getArtworkDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.duplicateArtwork(
      {
        artworkId: "non-existent-artwork",
        title: "Duplicated Artwork",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "ARTWORK_NOT_FOUND" });
  });

  test("should return PERMISSION_DENIED when trying to duplicate another user's artwork", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getArtworkDoc = () =>
      Promise.resolve({
        id: "artwork-123",
        ownerId: "different-user-456", // 다른 사용자의 아트워크
        title: "Original Artwork",
        originalImageId: "image123",
        dpi: 300,
        imageCenterXy: { x: 0.5, y: 0.5 },
        sideProcessing: { type: "none" },
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.duplicateArtwork(
      {
        artworkId: "artwork-123",
        title: "Duplicated Artwork",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "PERMISSION_DENIED" });
  });

  test("should successfully duplicate artwork when user owns it", async () => {
    setLoggedIn("user-123", "session-123");

    const mockArtwork = {
      id: "artwork-123",
      ownerId: "user-123",
      title: "Original Artwork",
      originalImageId: "image123",
      dpi: 300,
      imageCenterXy: { x: 0.5, y: 0.5 },
      sideProcessing: { type: "clip" as const },
      $v: 1,
    };

    ddb.getArtworkDoc = () => Promise.resolve(mockArtwork);

    let txCalled = false;
    let createdArtwork: any;
    let ownerRef: any;
    ddb.tx = (callback: any) => {
      txCalled = true;
      const mockTx = {
        createArtworkDoc: (artwork: any, owner: any) => {
          createdArtwork = artwork;
          ownerRef = owner;
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
    const result = await apis.duplicateArtwork(
      {
        artworkId: "artwork-123",
        title: "My Duplicated Artwork",
      },
      req
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artworkId).toBeDefined();
      expect(typeof result.artworkId).toBe("string");
      expect(result.artworkId).not.toBe("artwork-123"); // 새로운 ID여야 함
    }
    expect(txCalled).toBe(true);
    expect(ownerRef).toEqual({ id: "user-123" });

    // 복제된 아트워크 검증
    expect(createdArtwork).toMatchObject({
      ownerId: "user-123",
      title: "My Duplicated Artwork", // 새로운 제목
      originalImageId: "image123", // 원본과 동일
      dpi: 300, // 원본과 동일
      imageCenterXy: { x: 0.5, y: 0.5 }, // 원본과 동일
      sideProcessing: { type: "clip" }, // 원본과 동일
      $v: 1, // 원본과 동일
    });
    expect(createdArtwork.id).toBeDefined();
    expect(createdArtwork.id).not.toBe("artwork-123"); // 새로운 ID여야 함
  });
});
