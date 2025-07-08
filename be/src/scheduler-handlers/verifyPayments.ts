import { verifyOrderPayment } from "../payment/verifyOrderPayment";
import { ddb } from "../__generated/db";
import { SchedulerHandlers } from "../scheduler";

export const verifyPayments: SchedulerHandlers["verifyPayments"] = async () => {
  let nextToken: string | undefined;

  do {
    const result = await ddb.queryPaymentVerifingOrderList({
      limit: 5,
    });
    nextToken = result.nextToken;

    await Promise.all(
      result.items.map(async (order) => {
        await verifyOrderPayment({ orderId: order.orderId });
        ddb.deletePaymentVerifingOrderListItem({ orderId: order.orderId });
      })
    );
  } while (nextToken);
};
