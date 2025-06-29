import { ApiSpec } from "shared";
import { getSession } from "../session";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { generateId } from "../utils/uuid";

export const createOrder = async (
  { order }: ApiSpec["createOrder"]["req"],
  req: ApiRequest
): Promise<ApiSpec["createOrder"]["res"]> => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "INVALID_ARTWORK" };
  }

  const user = await ddb.getUser({ id: session.userId });
  if (!user) {
    return { ok: false, reason: "INVALID_ARTWORK" };
  }

  if (!order.artwork?.originalImageS3Key) {
    return { ok: false, reason: "INVALID_ARTWORK" };
  }

  const orderId = generateId();

  const newOrder = {
    ...order,
    id: orderId,
    userId: session.userId,
    orderDate: new Date().toISOString(),
    status: "payment_completed" as const,
  };

  try {
    await ddb.putOrder(newOrder);
    return { ok: true, orderId };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { ok: false, reason: "INVALID_ARTWORK" };
  }
};