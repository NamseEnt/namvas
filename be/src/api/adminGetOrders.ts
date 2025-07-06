import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { isAdmin } from "../session/adminCheck";
import { getOrdersByStatus, getAllOrders } from "../utils/orderQueries";

export const adminGetOrders = async (
  { status, search, page = 1, limit = 20 }: ApiSpec["adminGetOrders"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminGetOrders"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    let orders;
    
    if (status) {
      orders = await getOrdersByStatus({ status });
    } else {
      const result = await getAllOrders({ limit: limit * page });
      orders = result.orders;
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.recipient.name.toLowerCase().includes(searchLower) ||
        order.recipient.phone.includes(search)
      );
    }

    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedOrders = orders.slice(startIndex, startIndex + limit);

    return {
      ok: true,
      orders: paginatedOrders,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error("Failed to get orders:", error);
    return { ok: false, reason: "NOT_ADMIN" };
  }
};