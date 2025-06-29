import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { isAdmin } from "../session/adminCheck";
import { getUsersWithOrders } from "../db/orderQueries";

export const adminGetUsers = async (
  { search, page = 1, limit = 20 }: ApiSpec["adminGetUsers"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminGetUsers"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const result = await getUsersWithOrders({ limit: limit * page });
    let users = result.users;

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(({ user, orders }) => 
        user.id.toLowerCase().includes(searchLower) ||
        orders.some(order => 
          order.recipient.name.toLowerCase().includes(searchLower) ||
          order.recipient.phone.includes(search)
        )
      );
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    const usersWithOrders = paginatedUsers.map(({ user, orders }) => ({
      id: user.id,
      joinedAt: user.createdAt,
      orders
    }));

    return {
      ok: true,
      users: usersWithOrders,
      total,
      page,
      totalPages
    };
  } catch (error) {
    console.error("Failed to get users:", error);
    return { ok: false, reason: "NOT_ADMIN" };
  }
};