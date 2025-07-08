import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";
import { OrderDoc } from "../schema";
import { sqs } from "../sqs";

const alreadyCancelRequestedStatuses: OrderDoc["status"][] = [
  "payment_cancelling",
  "payment_canceled",
  "payment_cancel_rejected",
];
const cancelableStatuses: OrderDoc["status"][] = [
  "payment_verifing",
  "payment_failed",
  "waiting_start_production",
];

export const cancelOrder: Apis["cancelOrder"] = async ({ orderId }, req) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const orderDoc = await ddb.getOrderDoc({ id: orderId });

  if (!orderDoc) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }

  if (orderDoc.userId !== session.userId) {
    return { ok: false, reason: "PERMISION_DENIED" };
  }

  if (alreadyCancelRequestedStatuses.includes(orderDoc.status)) {
    return { ok: true };
  }

  if (!cancelableStatuses.includes(orderDoc.status)) {
    return { ok: false, reason: "TOO_LATE_TO_CANCEL" };
  }

  orderDoc.logs.push({
    type: "order_cancel_requested",
    timestamp: new Date().toISOString(),
    message: "",
  });
  orderDoc.status = "payment_cancelling";
  await ddb.tx((tx) =>
    tx.updateOrderDoc(orderDoc).createPaymentCancellingOrderList({
      orderId,
    })
  );

  await sqs.send("cancelOrder", { orderId });

  return { ok: true };
};
