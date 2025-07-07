import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { isAdmin } from "../session/adminCheck";

export const adminUpdateOrderStatus = async (
  { orderId, status }: ApiSpec["adminUpdateOrderStatus"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminUpdateOrderStatus"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const order = await ddb.getOrderDoc({ id: orderId });
    
    if (!order) {
      return { ok: false, reason: "ORDER_NOT_FOUND" };
    }

    const updatedOrder = {
      ...order,
      status: status as "payment_pending" | "payment_completed" | "payment_failed" | "in_production" | "shipping" | "delivered"
    };

    await ddb.tx(tx => tx.updateOrderDoc(updatedOrder));
    
    return { ok: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }
};