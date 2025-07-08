import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

describe("updateArtwork", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.updateArtwork(
      {
        artworkId: "artwork-123",
        title: "Updated Title",
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
    const result = await apis.updateArtwork(
      {
        artworkId: "non-existent-artwork",
        title: "Updated Title",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "ARTWORK_NOT_FOUND" });
  });

  test("should return PERMISSION_DENIED when trying to update another user's artwork", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getArtworkDoc = () =>
      Promise.resolve({
        id: "artwork-123",
        ownerId: "different-user-456", // 다른 사용자의 아트워크
        title: "Original Title",
        originalImageId: "image123",
        dpi: 300,
        imageCenterXy: { x: 0.5, y: 0.5 },
        sideProcessing: { type: "none" as const },
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.updateArtwork(
      {
        artworkId: "artwork-123",
        title: "Updated Title",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "PERMISSION_DENIED" });
  });

  test("should update title only when only title is provided", async () => {
    setLoggedIn("user-123", "session-123");

    const mockArtwork = {
      id: "artwork-123",
      ownerId: "user-123",
      title: "Original Title",
      originalImageId: "image123",
      dpi: 300,
      imageCenterXy: { x: 0.5, y: 0.5 },
      sideProcessing: { type: "none" as const },
      $v: 1,
    };

    ddb.getArtworkDoc = () => Promise.resolve(mockArtwork);

    let txCalled = false;
    let updatedArtwork: any;
    ddb.tx = (callback: any) => {
      txCalled = true;
      const mockTx = {
        updateArtworkDoc: (artwork: any) => {
          updatedArtwork = artwork;
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
    const result = await apis.updateArtwork(
      {
        artworkId: "artwork-123",
        title: "Updated Title",
      },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(txCalled).toBe(true);
    expect(updatedArtwork.title).toBe("Updated Title");
    expect(updatedArtwork.originalImageId).toBe("image123"); // 변경되지 않음
    expect(updatedArtwork.dpi).toBe(300); // 변경되지 않음
  });

  test("should update artwork only when only artwork is provided", async () => {
    setLoggedIn("user-123", "session-123");

    const mockArtwork = {
      id: "artwork-123",
      ownerId: "user-123",
      title: "Original Title",
      originalImageId: "image123",
      dpi: 300,
      imageCenterXy: { x: 0.5, y: 0.5 },
      sideProcessing: { type: "none" as const },
      $v: 1,
    };

    ddb.getArtworkDoc = () => Promise.resolve(mockArtwork);

    let txCalled = false;
    let updatedArtwork: any;
    ddb.tx = (callback: any) => {
      txCalled = true;
      const mockTx = {
        updateArtworkDoc: (artwork: any) => {
          updatedArtwork = artwork;
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
    const result = await apis.updateArtwork(
      {
        artworkId: "artwork-123",
        artwork: {
          originalImageId: "image456",
          dpi: 600,
          imageCenterXy: { x: 0.3, y: 0.7 },
          sideProcessing: { type: "clip" },
        },
      },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(txCalled).toBe(true);
    expect(updatedArtwork.title).toBe("Original Title"); // 변경되지 않음
    expect(updatedArtwork.originalImageId).toBe("image456"); // 변경됨
    expect(updatedArtwork.dpi).toBe(600); // 변경됨
    expect(updatedArtwork.imageCenterXy).toEqual({ x: 0.3, y: 0.7 }); // 변경됨
    expect(updatedArtwork.sideProcessing).toEqual({ type: "clip" }); // 변경됨
  });

  test("should update both title and artwork when both are provided", async () => {
    setLoggedIn("user-123", "session-123");

    const mockArtwork = {
      id: "artwork-123",
      ownerId: "user-123",
      title: "Original Title",
      originalImageId: "image123",
      dpi: 300,
      imageCenterXy: { x: 0.5, y: 0.5 },
      sideProcessing: { type: "none" as const },
      $v: 1,
    };

    ddb.getArtworkDoc = () => Promise.resolve(mockArtwork);

    let txCalled = false;
    let updatedArtwork: any;
    ddb.tx = (callback: any) => {
      txCalled = true;
      const mockTx = {
        updateArtworkDoc: (artwork: any) => {
          updatedArtwork = artwork;
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
    const result = await apis.updateArtwork(
      {
        artworkId: "artwork-123",
        title: "Updated Title",
        artwork: {
          originalImageId: "image789",
          dpi: 150,
          imageCenterXy: { x: 0.8, y: 0.2 },
          sideProcessing: { type: "color", color: "#ff0000" },
        },
      },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(txCalled).toBe(true);
    expect(updatedArtwork.title).toBe("Updated Title"); // 변경됨
    expect(updatedArtwork.originalImageId).toBe("image789"); // 변경됨
    expect(updatedArtwork.dpi).toBe(150); // 변경됨
    expect(updatedArtwork.imageCenterXy).toEqual({ x: 0.8, y: 0.2 }); // 변경됨
    expect(updatedArtwork.sideProcessing).toEqual({
      type: "color",
      color: "#ff0000",
    }); // 변경됨
  });
});
