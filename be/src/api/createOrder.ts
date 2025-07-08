import { ddb } from "../__generated/db";
import { getSession } from "../session";
import { generateId } from "../utils/uuid";
import { sqs } from "../sqs";
import { Apis } from "../apis";

export const createOrder: Apis["createOrder"] = async (
  { rows, naverPaymentId, recipient },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  if (rows.length === 0) {
    return { ok: false, reason: "EMPTY_ORDER_ITEMS" };
  }

  // 각 주문 항목 검증
  for (const row of rows) {
    // 1. 아이템 타입 검증
    if (row.item.type !== "artwork" && row.item.type !== "plasticStand") {
      return { ok: false, reason: "INVALID_ITEM_TYPE" };
    }
    
    // 2. 갯수 검증
    if (row.count <= 0) {
      return { ok: false, reason: "INVALID_COUNT" };
    }
    
    // 3. 가격 검증
    if (row.price <= 0) {
      return { ok: false, reason: "INVALID_PRICE" };
    }
    
    // 4. 아이템별 정확한 가격 검증
    const expectedPrice = row.item.type === "artwork" ? 10000 : 250;
    if (row.price !== expectedPrice) {
      return { ok: false, reason: "INVALID_PRICE" };
    }
  }

  const orderId = generateId();

  await ddb.tx((tx) =>
    tx
      .createOrderDoc(
        {
          id: orderId,
          userId: session.userId,
          naverPaymentId,
          rows,
          recipient,
          status: "payment_verifing",
          logs: [
            {
              type: "order_arrived",
              timestamp: new Date().toISOString(),
              message: "",
            },
          ],
        },
        { id: session.userId }
      )
      .createPaymentVerifingOrderList({
        orderId,
      })
  );

  await sqs.send("processPayment", { orderId });

  return {
    ok: true,
    orderId,
  };
};
