import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";

export const cancelOrder = async (
  { orderId }: ApiSpec["cancelOrder"]["req"],
  req: ApiRequest
): Promise<ApiSpec["cancelOrder"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_AUTHORIZED" };
  }

  try {
    const order = await ddb.getOrder({ id: orderId });
    
    if (!order) {
      return { ok: false, reason: "ORDER_NOT_FOUND" };
    }

    if (order.userId !== session.userId) {
      return { ok: false, reason: "NOT_AUTHORIZED" };
    }

    if (order.status === "shipping" || order.status === "delivered") {
      return { ok: false, reason: "TOO_LATE_TO_CANCEL" };
    }

    await ddb.deleteOrder({ id: orderId });
    
    return { ok: true };
  } catch (error) {
    console.error("Failed to cancel order:", error);
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }
};