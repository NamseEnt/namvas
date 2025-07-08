import { apis } from "../src/apis";
import { ddb } from "../src/__generated/db";
import { ApiRequest } from "../src/types";
import { setLoggedIn, setLoggedOut } from "./sessionUtil";

describe("listMyOrders", () => {
  test("should return NOT_LOGGED_IN when user is not logged in", async () => {
    setLoggedOut();

    const req: ApiRequest = {
      cookies: { sessionId: "some-session-id" },
      headers: {},
    };
    const result = await apis.listMyOrders({ pageSize: 10 }, req);

    expect(result).toEqual({ ok: false, reason: "NOT_LOGGED_IN" });
  });

  test("should return empty orders list when user has no orders", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.queryOrdersOfUser = () =>
      Promise.resolve({
        items: [],
        nextToken: undefined,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyOrders({ pageSize: 10 }, req);

    expect(result).toEqual({
      ok: true,
      orders: [],
    });
  });

  test("should return orders list when user has orders", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.queryOrdersOfUser = () =>
      Promise.resolve({
        items: [
          {
            id: "order-1",
            userId: "user-123",
            naverPaymentId: "naver_pay_123",
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
          },
        ],
        nextToken: undefined,
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyOrders({ pageSize: 10 }, req);

    expect(result).toEqual({
      ok: true,
      orders: [
        {
          id: "order-1",
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
        },
      ],
    });
  });

  test("should handle pagination with nextToken", async () => {
    setLoggedIn("user-123", "session-123");
    ddb.queryOrdersOfUser = () =>
      Promise.resolve({
        items: [
          {
            id: "order-1",
            userId: "user-123",
            naverPaymentId: "naver_pay_123",
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
          },
        ],
        nextToken: "next-page-token",
      });

    const req: ApiRequest = {
      cookies: { sessionId: "session-123" },
      headers: {},
    };
    const result = await apis.listMyOrders({ pageSize: 1 }, req);

    expect(result).toEqual({
      ok: true,
      orders: [
        {
          id: "order-1",
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
        },
      ],
      nextToken: "next-page-token",
    });
  });

  test("should handle pagination with provided nextToken", async () => {
    setLoggedIn("user-123", "session-123");

    let queryParams: any;
    ddb.queryOrdersOfUser = (params) => {
      queryParams = params;
      return Promise.resolve({
        items: [
          {
            id: "order-2",
            userId: "user-123",
            naverPaymentId: "naver_pay_456",
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
              name: "김철수",
              phone: "010-9876-5432",
              postalCode: "54321",
              address: "부산시 해운대구",
              addressDetail: "202호",
              memo: "경비실에 맡겨주세요",
            },
            status: "delivered" as const,
            logs: [
              {
                type: "order_arrived" as const,
                timestamp: "2023-01-02T00:00:00.000Z",
                message: "",
              },
            ],
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
    const result = await apis.listMyOrders(
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
      orders: [
        {
          id: "order-2",
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
            name: "김철수",
            phone: "010-9876-5432",
            postalCode: "54321",
            address: "부산시 해운대구",
            addressDetail: "202호",
            memo: "경비실에 맡겨주세요",
          },
          status: "delivered" as const,
          logs: [
            {
              type: "order_arrived" as const,
              timestamp: "2023-01-02T00:00:00.000Z",
              message: "",
            },
          ],
        },
      ],
    });
  });
});
