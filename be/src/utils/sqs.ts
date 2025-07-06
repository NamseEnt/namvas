import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { config } from "../config";
import { QueueSpec, createQueueMessage } from "../queueSpec";

const sqsClient = new SQSClient({
  region: config.region,
  ...(config.localstack && {
    endpoint: config.localstack.endpoint,
  }),
});

// 공용 큐 메시지 전송 함수 (ApiSpec 패턴)
export const sendQueueMessage = async <T extends keyof QueueSpec>(
  type: T,
  req: QueueSpec[T]["req"],
  options: { priority?: "high" | "medium" | "low"; source?: string } = {}
) => {
  const message = createQueueMessage(type, req, options);

  const command = new SendMessageCommand({
    QueueUrl: config.queueUrl,
    MessageBody: JSON.stringify(message),
    DelaySeconds: 0,
    MessageAttributes: {
      messageType: {
        DataType: "String",
        StringValue: type,
      },
      priority: {
        DataType: "String",
        StringValue: message.metadata.priority,
      },
      messageId: {
        DataType: "String",
        StringValue: message.metadata.messageId,
      },
    },
  });

  await sqsClient.send(command);
  console.log(`Sent queue message: ${type}`, { messageId: message.metadata.messageId });
};

// 편의 함수들 (ApiSpec 패턴과 유사)
export const sendPaymentProcessingMessage = async (orderId: string, naverPaymentId: string) => {
  await sendQueueMessage("processPayment", { orderId, naverPaymentId }, { priority: "high" });
};

export const sendEmailMessage = async (to: string, subject: string, body: string) => {
  await sendQueueMessage("sendEmail", { to, subject, body });
};

export const sendRefundMessage = async (orderId: string, amount: number, reason: string) => {
  await sendQueueMessage("processRefund", { orderId, amount, reason }, { priority: "high" });
};

export const sendNotificationMessage = async (userId: string, title: string, message: string, type: "info" | "warning" | "error") => {
  await sendQueueMessage("sendNotification", { userId, title, message, type });
};