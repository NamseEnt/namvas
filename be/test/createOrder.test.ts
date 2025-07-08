import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { sqs } from "../src/sqs";
import { ApiRequest } from "../src/types";

// SQS 모킹 (db.ts와 같은 방식)
sqs.send = () => Promise.resolve();

describe("createOrder", () => {
  test("should return NOT_LOGGED_IN when not logged in", async () => {
    ddb.getSessionDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.createOrder(
      {
        rows: [
          {
            item: {
              type: "artwork",
              title: "Test Artwork",
              originalImageId: "image123",
              dpi: 300,
              imageCenterXy: { x: 0.5, y: 0.5 },
              sideProcessing: { type: "none" },
            },
            count: 1,
            price: 10000,
          },
        ],
        naverPaymentId: "naver_pay_123",
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return EMPTY_ORDER_ITEMS when no order items", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder(
      {
        rows: [],
        naverPaymentId: "naver_pay_123",
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
      },
      req
    );

    expect(result).toEqual({ ok: false, reason: "EMPTY_ORDER_ITEMS" });
  });

  test("should create order successfully (no artwork not found test needed)", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.tx = () => Promise.resolve();

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder(
      {
        rows: [
          {
            item: {
              type: "artwork",
              title: "Test Artwork",
              originalImageId: "image123",
              dpi: 300,
              imageCenterXy: { x: 0.5, y: 0.5 },
              sideProcessing: { type: "none" },
            },
            count: 1,
            price: 10000,
          },
        ],
        naverPaymentId: "naver_pay_123",
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
      },
      req
    );

    expect(result.ok).toBe(true);
  });

  test("should create order successfully", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    let txCalled = false;
    ddb.tx = () => {
      txCalled = true;
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder(
      {
        rows: [
          {
            item: {
              type: "artwork",
              title: "Test Artwork",
              originalImageId: "image123",
              dpi: 300,
              imageCenterXy: { x: 0.5, y: 0.5 },
              sideProcessing: { type: "none" },
            },
            count: 2,
            price: 10000,
          },
        ],
        naverPaymentId: "naver_pay_123",
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
      },
      req
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderId).toBeDefined();
    }
    expect(txCalled).toBe(true);
  });
});
