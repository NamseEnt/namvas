import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

describe("createOrder", () => {
  test("should return INTERNAL_ERROR when not logged in", async () => {
    ddb.getSessionDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.createOrder({
      orderItems: [{ artworkId: "artwork1", quantity: 1, price: 10000 }],
      plasticStandCount: 0,
      plasticStandPrice: 0,
      totalPrice: 10000,
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요"
      }
    }, req);

    expect(result).toEqual({ ok: false, reason: "INTERNAL_ERROR" });
  });

  test("should return INVALID_REQUEST when no order items", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder({
      orderItems: [],
      plasticStandCount: 0,
      plasticStandPrice: 0,
      totalPrice: 0,
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요"
      }
    }, req);

    expect(result).toEqual({ ok: false, reason: "INVALID_REQUEST" });
  });

  test("should return INVALID_REQUEST when price mismatch", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder({
      orderItems: [{ artworkId: "artwork1", quantity: 1, price: 10000 }],
      plasticStandCount: 0,
      plasticStandPrice: 0,
      totalPrice: 15000, // 잘못된 가격
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요"
      }
    }, req);

    expect(result).toEqual({ ok: false, reason: "INVALID_REQUEST" });
  });

  test("should return INVALID_REQUEST when artwork not found", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getArtworkDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder({
      orderItems: [{ artworkId: "nonexistent", quantity: 1, price: 10000 }],
      plasticStandCount: 0,
      plasticStandPrice: 0,
      totalPrice: 10000,
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요"
      }
    }, req);

    expect(result).toEqual({ ok: false, reason: "INVALID_REQUEST" });
  });

  test("should create order successfully", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getArtworkDoc = () =>
      Promise.resolve({
        $v: 1,
        id: "artwork1",
        ownerId: "user123",
        title: "Test Artwork",
        originalImageId: "image123",
        dpi: 300,
        imageCenterXy: { x: 0.5, y: 0.5 },
        sideProcessing: { type: "none" }
      });
    let putOrderDocCalled = false;
    ddb.putOrderDoc = () => {
      putOrderDocCalled = true;
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder({
      orderItems: [{ artworkId: "artwork1", quantity: 2, price: 10000 }],
      plasticStandCount: 1,
      plasticStandPrice: 5000,
      totalPrice: 25000, // 2 * 10000 + 1 * 5000
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요"
      }
    }, req);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderId).toBeDefined();
      expect(result.paymentUrl).toBeDefined();
      expect(result.paymentRequestId).toBeDefined();
      expect(result.paymentUrl).toContain(result.paymentRequestId);
    }
    expect(putOrderDocCalled).toBe(true);
  });
});