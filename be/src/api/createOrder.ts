import { ddb } from "../__generated/db";
import { getSession } from "../session";
import { generateId } from "../utils/uuid";
import { sqs } from "../sqs";
import { Apis } from "../apis";

export const createOrder: Apis["createOrder"] = async (
  { rows, naverPaymentId, recipient },
  req
) => {
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "NOT_LOGGED_IN" };
  }

  if (rows.length === 0) {
    return { ok: false, reason: "EMPTY_ORDER_ITEMS" };
  }

  const orderId = generateId();

  await ddb.tx((tx) =>
    tx
      .createOrderDoc(
        {
          id: orderId,
          userId: session.userId,
          naverPaymentId,
          rows,
          recipient,
          status: "payment_verifing",
          logs: [
            {
              type: "order_arrived",
              timestamp: new Date().toISOString(),
              message: "",
            },
          ],
        },
        { id: session.userId }
      )
      .createPaymentVerifingOrderList({
        orderId,
      })
  );

  await sqs.send("processPayment", { orderId });

  return {
    ok: true,
    orderId,
  };
};
