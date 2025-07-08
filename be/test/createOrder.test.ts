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

    // SQS 호출 추적
    let sqsCalled = false;
    let sqsMessage: any;
    sqs.send = (messageType: string, data: any) => {
      sqsCalled = true;
      sqsMessage = { messageType, data };
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
      
      // SQS 메시지 검증
      expect(sqsCalled).toBe(true);
      expect(sqsMessage).toEqual({
        messageType: "processPayment",
        data: { orderId: result.orderId },
      });
    }
    expect(txCalled).toBe(true);
  });

  test("should reject unknown item type", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder(
      {
        rows: [
          {
            item: {
              type: "unknownItem" as any,
            },
            count: 1,
            price: 1000,
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

    expect(result).toEqual({ ok: false, reason: "INVALID_ITEM_TYPE" });
  });

  test("should reject negative count", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

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
            count: -1,
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

    expect(result).toEqual({ ok: false, reason: "INVALID_COUNT" });
  });

  test("should reject zero count", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

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
            count: 0,
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

    expect(result).toEqual({ ok: false, reason: "INVALID_COUNT" });
  });

  test("should reject negative price", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

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
            price: -1000,
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

    expect(result).toEqual({ ok: false, reason: "INVALID_PRICE" });
  });

  test("should reject incorrect artwork price", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

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
            price: 5000, // 잘못된 가격 (올바른 가격은 10000)
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

    expect(result).toEqual({ ok: false, reason: "INVALID_PRICE" });
  });

  test("should reject incorrect plasticStand price", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.createOrder(
      {
        rows: [
          {
            item: {
              type: "plasticStand",
            },
            count: 1,
            price: 1000, // 잘못된 가격 (올바른 가격은 250)
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

    expect(result).toEqual({ ok: false, reason: "INVALID_PRICE" });
  });

  test("should allow duplicate orders with same naverPaymentId", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });

    let txCallCount = 0;
    ddb.tx = () => {
      txCallCount++;
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const orderData = {
      rows: [
        {
          item: {
            type: "artwork" as const,
            title: "Test Artwork",
            originalImageId: "image123",
            dpi: 300,
            imageCenterXy: { x: 0.5, y: 0.5 },
            sideProcessing: { type: "none" as const },
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
    };

    // 첫 번째 주문
    const result1 = await apis.createOrder(orderData, req);
    expect(result1.ok).toBe(true);

    // 두 번째 주문 (동일한 naverPaymentId)
    const result2 = await apis.createOrder(orderData, req);
    expect(result2.ok).toBe(true);

    expect(txCallCount).toBe(2);
  });
});
