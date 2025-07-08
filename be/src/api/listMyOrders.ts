import { getSession } from "../session";
import { ddb } from "../__generated/db";
import { Apis } from "../apis";

export const listMyOrders: Apis["listMyOrders"] = async (
  { nextToken, pageSize },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  const result = await ddb.queryOrdersOfUser({
    id: session.userId,
    nextToken,
    limit: pageSize,
  });

  return {
    ok: true,
    orders: result.items.map((orderDoc) => ({
      id: orderDoc.id,
      rows: orderDoc.rows,
      recipient: orderDoc.recipient,
      status: orderDoc.status,
      logs: orderDoc.logs,
    })),
    ...(result.nextToken && { nextToken: result.nextToken }),
  };
};
