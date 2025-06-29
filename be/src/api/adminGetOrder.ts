import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { isAdmin } from "../session/adminCheck";

export const adminGetOrder = async (
  { orderId }: ApiSpec["adminGetOrder"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminGetOrder"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const order = await ddb.getOrder({ id: orderId });
    
    if (!order) {
      return { ok: false, reason: "ORDER_NOT_FOUND" };
    }

    return { ok: true, order };
  } catch (error) {
    console.error("Failed to get order:", error);
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }
};