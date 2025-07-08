import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const cancelOrder: Apis["cancelOrder"] = async ({ orderId }, req) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "PERMISION_DENIED" };
  }

  const order = await ddb.getOrderDoc({ id: orderId });
  
  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }

  if (order.userId !== session.userId) {
    return { ok: false, reason: "PERMISION_DENIED" };
  }

  if (order.status === "shipping" || order.status === "delivered") {
    return { ok: false, reason: "TOO_LATE_TO_CANCEL" };
  }

  await ddb.deleteOrderDoc({ id: orderId });
  
  return { ok: true };
};