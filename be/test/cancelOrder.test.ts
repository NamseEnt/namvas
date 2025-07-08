import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { sqs } from "../src/sqs";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

// SQS 모킹
sqs.send = () => Promise.resolve();

describe("cancelOrder", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return ORDER_NOT_FOUND when order does not exist", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getOrderDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder(
      { orderId: "non-existent-order" },
      req
    );

    expect(result).toEqual({ ok: false, reason: "ORDER_NOT_FOUND" });
  });

  test("should return PERMISION_DENIED when trying to cancel another user's order", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getOrderDoc = () =>
      Promise.resolve({
        id: "order-123",
        userId: "different-user-456", // 다른 사용자의 주문
        naverPaymentId: "naver_pay_123",
        rows: [
          {
            item: {
              type: "artwork" as const,
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
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
        status: "payment_verifing",
        logs: [
          {
            type: "order_arrived",
            timestamp: "2023-01-01T00:00:00.000Z",
            message: "",
          },
        ],
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: false, reason: "PERMISION_DENIED" });
  });

  test("should return ok true when order is already cancel requested (payment_cancelling)", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getOrderDoc = () =>
      Promise.resolve({
        id: "order-123",
        userId: "user-123",
        naverPaymentId: "naver_pay_123",
        rows: [
          {
            item: {
              type: "artwork" as const,
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
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
        status: "payment_cancelling", // 이미 취소 요청 중
        logs: [
          {
            type: "order_arrived",
            timestamp: "2023-01-01T00:00:00.000Z",
            message: "",
          },
        ],
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: true });
  });

  test("should return ok true when order is already canceled (payment_canceled)", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getOrderDoc = () =>
      Promise.resolve({
        id: "order-123",
        userId: "user-123",
        naverPaymentId: "naver_pay_123",
        rows: [
          {
            item: {
              type: "artwork" as const,
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
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
        status: "payment_canceled", // 이미 취소됨
        logs: [
          {
            type: "order_arrived",
            timestamp: "2023-01-01T00:00:00.000Z",
            message: "",
          },
        ],
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: true });
  });

  test("should return TOO_LATE_TO_CANCEL when order is in production", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.getOrderDoc = () =>
      Promise.resolve({
        id: "order-123",
        userId: "user-123",
        naverPaymentId: "naver_pay_123",
        rows: [
          {
            item: {
              type: "artwork" as const,
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
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: "문앞에 놔주세요",
        },
        status: "in_production", // 생산 중
        logs: [
          {
            type: "order_arrived",
            timestamp: "2023-01-01T00:00:00.000Z",
            message: "",
          },
        ],
        $v: 1,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: false, reason: "TOO_LATE_TO_CANCEL" });
  });

  test("should successfully cancel order when order is cancelable", async () => {
    setLoggedIn("user-123", "session-123");

    const mockOrder = {
      id: "order-123",
      userId: "user-123",
      naverPaymentId: "naver_pay_123",
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
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요",
      },
      status: "payment_verifing" as const, // 취소 가능한 상태
      logs: [
        {
          type: "order_arrived" as const,
          timestamp: "2023-01-01T00:00:00.000Z",
          message: "",
        },
      ],
      $v: 1,
    };

    ddb.getOrderDoc = () => Promise.resolve(mockOrder);

    let txCalled = false;
    let updatedOrder: any;
    ddb.tx = (callback: any) => {
      txCalled = true;
      const mockTx = {
        updateOrderDoc: (order: any) => {
          updatedOrder = order;
          return mockTx;
        },
        createPaymentCancellingOrderList: (params: any) => {
          expect(params).toEqual({ orderId: "order-123" });
          return mockTx;
        },
      };
      callback(mockTx);
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
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: true });
    expect(txCalled).toBe(true);
    expect(updatedOrder.status).toBe("payment_cancelling");
    expect(updatedOrder.logs).toHaveLength(2);
    expect(updatedOrder.logs[1].type).toBe("order_cancel_requested");

    // SQS 메시지 검증
    expect(sqsCalled).toBe(true);
    expect(sqsMessage).toEqual({
      messageType: "cancelOrder",
      data: { orderId: "order-123" },
    });
  });

  test("should successfully cancel order when order is in payment_failed status", async () => {
    setLoggedIn("user-123", "session-123");

    const mockOrder = {
      id: "order-123",
      userId: "user-123",
      naverPaymentId: "naver_pay_123",
      rows: [
        {
          item: {
            type: "plasticStand" as const,
          },
          count: 2,
          price: 250,
        },
      ],
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요",
      },
      status: "payment_failed" as const, // 취소 가능한 상태
      logs: [
        {
          type: "order_arrived" as const,
          timestamp: "2023-01-01T00:00:00.000Z",
          message: "",
        },
      ],
      $v: 1,
    };

    ddb.getOrderDoc = () => Promise.resolve(mockOrder);
    ddb.tx = () => Promise.resolve();

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: true });
  });

  test("should successfully cancel order when order is in waiting_start_production status", async () => {
    setLoggedIn("user-123", "session-123");

    const mockOrder = {
      id: "order-123",
      userId: "user-123",
      naverPaymentId: "naver_pay_123",
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
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: "문앞에 놔주세요",
      },
      status: "waiting_start_production" as const, // 취소 가능한 상태
      logs: [
        {
          type: "order_arrived" as const,
          timestamp: "2023-01-01T00:00:00.000Z",
          message: "",
        },
      ],
      $v: 1,
    };

    ddb.getOrderDoc = () => Promise.resolve(mockOrder);
    ddb.tx = () => Promise.resolve();

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.cancelOrder({ orderId: "order-123" }, req);

    expect(result).toEqual({ ok: true });
  });
});
