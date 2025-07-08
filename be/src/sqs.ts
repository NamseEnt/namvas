import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "./config";
import { isLocalDev } from "./isLocalDev";

const sqsClient = new SQSClient(
  isLocalDev()
    ? {
        endpoint: "http://localhost:4566",
        region: "us-east-1",
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
      }
    : {}
);

export const sqs = {
  async send<T extends keyof QueueMessageSpec>(
    type: T,
    req: QueueMessageSpec[T]["req"]
  ) {
    const command = new SendMessageCommand({
      QueueUrl: config.QUEUE_URL,
      MessageBody: JSON.stringify({
        type,
        req,
      }),
    });

    await sqsClient.send(command);
  },
};

export type QueueMessageSpec = {
  processPayment: {
    req: {
      orderId: string;
    };
  };
};
