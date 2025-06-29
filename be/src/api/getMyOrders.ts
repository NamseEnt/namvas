import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { getOrdersByUserId } from "../db/orderQueries";

export const getMyOrders = async (
  {}: ApiSpec["getMyOrders"]["req"],
  req: ApiRequest
): Promise<ApiSpec["getMyOrders"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  try {
    const orders = await getOrdersByUserId({ userId: session.userId });
    return { ok: true, orders };
  } catch (error) {
    console.error("Failed to get orders:", error);
    return { ok: true, orders: [] };
  }
};