import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { isAdmin } from "../session/adminCheck";
import { getAllOrders } from "../utils/orderQueries";

export const adminGetDashboard = async (
  {}: ApiSpec["adminGetDashboard"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminGetDashboard"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const { orders } = await getAllOrders({ limit: 1000 });
    
    const pendingTasks = orders
      .filter(order => order.status === "payment_completed" || order.status === "production_hold")
      .map(order => ({
        id: order.id,
        type: order.status as "payment_completed" | "production_hold",
        order
      }));

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => order.orderDate.startsWith(today));
    
    const todayStats = {
      orders: todayOrders.length,
      revenue: todayOrders.length * 25000, // Assuming fixed price
      newUsers: 0 // Would need to track user creation dates
    };

    return {
      ok: true,
      pendingTasks,
      todayStats
    };
  } catch (error) {
    console.error("Failed to get dashboard:", error);
    return { ok: false, reason: "NOT_ADMIN" };
  }
};