import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

describe("deleteArtwork", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.deleteArtwork(
      {
        artworkId: "artwork-123",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return ok true when artwork does not exist (idempotent)", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getArtworkDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.deleteArtwork(
      {
        artworkId: "non-existent-artwork",
      },
      req
    );

    expect(result).toEqual({ ok: true });
  });

  test("should return PERMISSION_DENIED when trying to delete another user's artwork", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getArtworkDoc = () =>
      Promise.resolve({
        id: "artwork-123",
        ownerId: "different-user-456", // 다른 사용자의 아트워크
        title: "Test Artwork",
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
    const result = await apis.deleteArtwork(
      {
        artworkId: "artwork-123",
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "PERMISSION_DENIED" });
  });

  test("should successfully delete artwork when user owns it", async () => {
    setLoggedIn("user-123", "session-123");

    const mockArtwork = {
      id: "artwork-123",
      ownerId: "user-123",
      title: "My Artwork",
      originalImageId: "image123",
      dpi: 300,
      imageCenterXy: { x: 0.5, y: 0.5 },
      sideProcessing: { type: "none" as const },
      $v: 1,
    };

    ddb.getArtworkDoc = () => Promise.resolve(mockArtwork);

    let deleteCalled = false;
    let deletedArtworkId: string;
    ddb.deleteArtworkDoc = (params: any) => {
      deleteCalled = true;
      deletedArtworkId = params.id;
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.deleteArtwork(
      {
        artworkId: "artwork-123",
      },
      req
    );

    expect(result).toEqual({ ok: true });
    expect(deleteCalled).toBe(true);
    expect(deletedArtworkId!).toBe("artwork-123");
  });
});
