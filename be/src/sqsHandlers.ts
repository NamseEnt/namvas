import { QueueMessageSpec } from "./sqs";

export const sqsHandlers: SqsHandlers = {
  processPayment: async (params) =>
    (await import("./sqs-handlers/processPayment")).processPayment(params),
};

export type SqsHandlers = {
  [K in keyof QueueMessageSpec]: (
    params: QueueMessageSpec[K]["req"]
  ) => Promise<void>;
};