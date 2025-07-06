import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { isAdmin } from "../session/adminCheck";
import { getFailedPaymentOrders } from "../utils/orderQueries";

export const adminGetFailedPayments = async (
  { page = 1, limit = 20 }: ApiSpec["adminGetFailedPayments"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminGetFailedPayments"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const failedOrders = await getFailedPaymentOrders();
    
    const total = failedOrders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedOrders = failedOrders.slice(startIndex, startIndex + limit);

    return {
      ok: true,
      orders: paginatedOrders,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error("Failed to get failed payment orders:", error);
    return { ok: false, reason: "NOT_ADMIN" };
  }
};