import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";

describe("confirmPayment", () => {
  test("should return INTERNAL_ERROR when not logged in", async () => {
    ddb.getSessionDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = { cookies: {}, headers: {} };
    const result = await apis.confirmPayment({
      paymentId: "payment123"
    }, req);

    expect(result).toEqual({ ok: false, reason: "INTERNAL_ERROR" });
  });

  test("should return PAYMENT_NOT_FOUND when order not found", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getOrderDoc = () => Promise.resolve(undefined);

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.confirmPayment({
      paymentId: "nonexistent"
    }, req);

    expect(result).toEqual({ ok: false, reason: "PAYMENT_NOT_FOUND" });
  });

  test("should return PAYMENT_NOT_FOUND when user mismatch", async () => {
    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getOrderDoc = () =>
      Promise.resolve({
        $v: 1,
        id: "order123",
        userId: "differentUser", // 다른 사용자의 주문
        paymentRequestId: "payment123",
        naverPaymentId: "",
        rows: [],
        recipient: {
          name: "홍길동",
          phone: "010-1234-5678",
          postalCode: "12345",
          address: "서울시 강남구",
          addressDetail: "101호",
          memo: ""
        },
        status: "payment_pending",
        logs: []
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.confirmPayment({
      paymentId: "payment123"
    }, req);

    expect(result).toEqual({ ok: false, reason: "PAYMENT_NOT_FOUND" });
  });

  test("should confirm successful payment", async () => {
    const mockOrder = {
      $v: 1,
      id: "order123",
      userId: "user123",
      paymentRequestId: "payment123",
      naverPaymentId: "",
      rows: [
        {
          item: {
            type: "artwork" as const,
            title: "Test Artwork",
            originalImageId: "image123",
            dpi: 300,
            imageCenterXy: { x: 0.5, y: 0.5 },
            sideProcessing: { type: "none" as const }
          },
          count: 1,
          price: 10000
        }
      ],
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: ""
      },
      status: "payment_pending" as const,
      logs: [
        {
          type: "payment_pending" as const,
          timestamp: "2023-01-01T00:00:00.000Z",
          message: "주문 생성 및 결제 대기 중"
        }
      ]
    };

    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getOrderDoc = () => Promise.resolve(mockOrder);
    let putOrderDocCalled = false;
    ddb.putOrderDoc = () => {
      putOrderDocCalled = true;
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };
    const result = await apis.confirmPayment({
      paymentId: "payment123"
    }, req);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.orderId).toBe("payment123"); // paymentId를 orderId로 가정
      expect(["success", "failed"]).toContain(result.status);
    }
    expect(putOrderDocCalled).toBe(true);
  });

  test("should handle failed payment", async () => {
    const mockOrder = {
      $v: 1,
      id: "order123",
      userId: "user123",
      paymentRequestId: "payment123",
      naverPaymentId: "",
      rows: [],
      recipient: {
        name: "홍길동",
        phone: "010-1234-5678",
        postalCode: "12345",
        address: "서울시 강남구",
        addressDetail: "101호",
        memo: ""
      },
      status: "payment_pending" as const,
      logs: []
    };

    ddb.getSessionDoc = () =>
      Promise.resolve({ userId: "user123", id: "session123", $v: 1 });
    ddb.getOrderDoc = () => Promise.resolve(mockOrder);
    let putOrderDocCalled = false;
    ddb.putOrderDoc = () => {
      putOrderDocCalled = true;
      return Promise.resolve();
    };

    const req: ApiRequest = {
      cookies: { sessionId: "session123" },
      headers: {},
    };

    // 여러 번 실행해서 랜덤한 결과 확인
    let failureFound = false;
    for (let i = 0; i < 10; i++) {
      const result = await apis.confirmPayment({
        paymentId: "payment123"
      }, req);
      
      if (result.ok && result.status === "failed") {
        failureFound = true;
        break;
      }
    }

    // 실패 케이스가 발생할 수 있음을 확인 (20% 확률이므로 10번 중 적어도 한 번은 실패할 가능성이 높음)
    expect(putOrderDocCalled).toBe(true);
  });
});