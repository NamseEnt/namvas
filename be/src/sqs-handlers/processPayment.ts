import { verifyOrderPayment } from "../payment/verifyOrderPayment";
import { QueueMessageSpec } from "../sqs";

export const processPayment = async ({
  orderId,
}: QueueMessageSpec["processPayment"]["req"]) => {
  await verifyOrderPayment({ orderId });
};
