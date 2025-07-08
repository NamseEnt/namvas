import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

describe("listMyArtworks", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.listMyArtworks(
      { pageSize: 10 },
      req
    );

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return empty artworks list when user has no artworks", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.queryArtworksOfUser = () =>
      Promise.resolve({
        items: [],
        nextToken: undefined,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyArtworks(
      { pageSize: 10 },
      req
    );

    expect(result).toEqual({
      ok: true,
      artworks: [],
    });
  });

  test("should return artworks list when user has artworks", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.queryArtworksOfUser = () =>
      Promise.resolve({
        items: [
          {
            id: "artwork-1",
            ownerId: "user-123",
            title: "My First Artwork",
            originalImageId: "image123",
            dpi: 300,
            imageCenterXy: { x: 0.5, y: 0.5 },
            sideProcessing: { type: "none" },
            $v: 1,
          },
          {
            id: "artwork-2",
            ownerId: "user-123",
            title: "My Second Artwork",
            originalImageId: "image456",
            dpi: 600,
            imageCenterXy: { x: 0.3, y: 0.7 },
            sideProcessing: { type: "clip" },
            $v: 1,
          },
        ],
        nextToken: undefined,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyArtworks(
      { pageSize: 10 },
      req
    );

    expect(result).toEqual({
      ok: true,
      artworks: [
        {
          id: "artwork-1",
          ownerId: "user-123",
          title: "My First Artwork",
          originalImageId: "image123",
          dpi: 300,
          imageCenterXy: { x: 0.5, y: 0.5 },
          sideProcessing: { type: "none" },
          $v: 1,
        },
        {
          id: "artwork-2",
          ownerId: "user-123",
          title: "My Second Artwork",
          originalImageId: "image456",
          dpi: 600,
          imageCenterXy: { x: 0.3, y: 0.7 },
          sideProcessing: { type: "clip" },
          $v: 1,
        },
      ],
    });
  });

  test("should handle pagination with nextToken", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.queryArtworksOfUser = () =>
      Promise.resolve({
        items: [
          {
            id: "artwork-1",
            ownerId: "user-123",
            title: "My First Artwork",
            originalImageId: "image123",
            dpi: 300,
            imageCenterXy: { x: 0.5, y: 0.5 },
            sideProcessing: { type: "none" },
            $v: 1,
          },
        ],
        nextToken: "next-page-token",
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyArtworks(
      { pageSize: 1 },
      req
    );

    expect(result).toEqual({
      ok: true,
      artworks: [
        {
          id: "artwork-1",
          ownerId: "user-123",
          title: "My First Artwork",
          originalImageId: "image123",
          dpi: 300,
          imageCenterXy: { x: 0.5, y: 0.5 },
          sideProcessing: { type: "none" },
          $v: 1,
        },
      ],
      nextToken: "next-page-token",
    });
  });

  test("should handle pagination with provided nextToken", async () => {
    setLoggedIn("user-123", "session-123");
    
    let queryParams: any;
    ddb.queryArtworksOfUser = (params) => {
      queryParams = params;
      return Promise.resolve({
        items: [
          {
            id: "artwork-2",
            ownerId: "user-123",
            title: "My Second Artwork",
            originalImageId: "image456",
            dpi: 600,
            imageCenterXy: { x: 0.3, y: 0.7 },
            sideProcessing: { type: "color", color: "#ff0000" },
            $v: 1,
          },
        ],
        nextToken: undefined,
      });
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyArtworks(
      { pageSize: 1, nextToken: "provided-token" },
      req
    );

    expect(queryParams).toEqual({
      id: "user-123",
      nextToken: "provided-token",
      limit: 1,
    });

    expect(result).toEqual({
      ok: true,
      artworks: [
        {
          id: "artwork-2",
          ownerId: "user-123",
          title: "My Second Artwork",
          originalImageId: "image456",
          dpi: 600,
          imageCenterXy: { x: 0.3, y: 0.7 },
          sideProcessing: { type: "color", color: "#ff0000" },
          $v: 1,
        },
      ],
    });
  });
});