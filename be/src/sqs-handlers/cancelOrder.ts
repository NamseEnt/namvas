import { cancelOrder as cancelOrderPayment } from "../payment/cancelOrder";
import { QueueMessageSpec } from "../sqs";

export const cancelOrder = async ({
  orderId,
}: QueueMessageSpec["cancelOrder"]["req"]) => {
  await cancelOrderPayment({ orderId });
};
