import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { getOrdersByStatus } from "../utils/orderQueries";

export const getMyOrders = async (
  {}: ApiSpec["getMyOrders"]["req"],
  req: ApiRequest
): Promise<ApiSpec["getMyOrders"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  try {
    // 임시로 빈 배열 반환 (실제 구현 필요)
    const orders: any[] = [];
    return { ok: true, orders };
  } catch (error) {
    console.error("Failed to get orders:", error);
    return { ok: true, orders: [] };
  }
};