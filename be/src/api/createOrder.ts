import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { getSession } from "../session";
import { generateId } from "../utils/uuid";
import { sqs } from "../sqs";
import { OrderDoc } from "../schema";

export const createOrder = async (
  {
    orderItems,
    plasticStandCount,
    plasticStandPrice,
    totalPrice,
    naverPaymentId,
    recipient,
  }: ApiSpec["createOrder"]["req"],
  req: ApiRequest
): Promise<ApiSpec["createOrder"]["res"]> => {
  // 세션 확인
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  // 요청 검증
  if (orderItems.length === 0) {
    return { ok: false, reason: "EMPTY_ORDER_ITEMS" };
  }

  // 가격 검증
  const itemsTotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const plasticStandTotal = plasticStandCount * plasticStandPrice;
  const calculatedTotal = itemsTotal + plasticStandTotal;

  if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
    return { ok: false, reason: "PRICE_MISMATCH" };
  }

  const orderId = generateId();

  // rows 구성 - artwork와 plasticStand 모두 포함
  const rows: OrderDoc["rows"] = [];

  // artwork 아이템들 추가
  for (const orderItem of orderItems) {
    rows.push({
      item: {
        type: "artwork",
        title: orderItem.artwork.title,
        originalImageId: orderItem.artwork.originalImageId,
        dpi: orderItem.artwork.dpi,
        imageCenterXy: orderItem.artwork.imageCenterXy,
        sideProcessing: orderItem.artwork.sideProcessing,
      },
      count: orderItem.quantity,
      price: orderItem.price,
    });
  }

  // plasticStand 아이템 추가
  if (plasticStandCount > 0) {
    rows.push({
      item: {
        type: "plasticStand",
      },
      count: plasticStandCount,
      price: plasticStandPrice,
    });
  }

  // 주문 생성 (payment_pending 상태)
  await ddb.tx(tx => tx.createOrderDoc({
    id: orderId,
    userId: session.userId,
    naverPaymentId,
    rows,
    recipient,
    status: "payment_pending",
    logs: [
      {
        type: "payment_pending",
        timestamp: new Date().toISOString(),
        message: "주문 생성 및 결제 확인 요청",
      },
    ],
  }));

  await sqs.send("processPayment", { orderId, naverPaymentId });

  return {
    ok: true,
    orderId,
  };
};
