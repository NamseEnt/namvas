import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { isAdmin } from "../session/adminCheck";

export const adminUpdateOrderStatus = async (
  { orderId, status, adminMemo }: ApiSpec["adminUpdateOrderStatus"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminUpdateOrderStatus"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const order = await ddb.getOrder({ id: orderId });
    
    if (!order) {
      return { ok: false, reason: "ORDER_NOT_FOUND" };
    }

    const updatedOrder = {
      ...order,
      status,
      adminMemo
    };

    await ddb.putOrder(updatedOrder);
    
    return { ok: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }
};