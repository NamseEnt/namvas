import { SQSHandler } from "aws-lambda";
import { QueueMessage, QueueSpec, QueueMessageMetadata } from "../queueSpec";
import { ddb } from "../__generated/db";

// 큐 핸들러 타입 정의 (ApiSpec 패턴)
type QueueHandlers = {
  [K in keyof QueueSpec]: (
    req: QueueSpec[K]["req"],
    metadata: QueueMessageMetadata
  ) => Promise<void>;
};

// 큐 핸들러들 (apis 객체와 유사한 구조)
const queueHandlers: QueueHandlers = {
  processPayment: handlePaymentProcessing,
  sendEmail: handleEmailSending,
  processRefund: handleRefundProcessing,
  sendNotification: handleNotificationSending,
};

export const queueProcessor: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const message: QueueMessage<keyof QueueSpec> = JSON.parse(record.body);
      const { type, data, metadata } = message;

      console.log(`Processing queue message: ${type}`, { messageId: metadata.messageId, priority: metadata.priority });

      // 핸들러 호출 (ApiSpec 패턴)
      const handler = queueHandlers[type];
      if (!handler) {
        console.error(`No handler found for message type: ${type}`);
        continue;
      }

      await handler(data, metadata);
      
      console.log(`Successfully processed message: ${type}`, { messageId: metadata.messageId });
    } catch (error) {
      console.error("Error processing queue message:", error);
      // SQS에서 메시지를 재시도하도록 에러를 던짐
      throw error;
    }
  }
};

// 결제 처리 핸들러
async function handlePaymentProcessing(
  req: QueueSpec["processPayment"]["req"],
  metadata: QueueMessageMetadata
) {
  const { orderId, naverPaymentId } = req;

  console.log(`Processing payment for order: ${orderId}, naverPaymentId: ${naverPaymentId}`);

  // 주문 조회
  const order = await ddb.getOrderDoc({ id: orderId });
  if (!order) {
    console.error(`Order not found: ${orderId}`);
    return;
  }

  // 이미 처리된 주문인지 확인
  if (order.status !== "payment_pending") {
    console.log(`Order ${orderId} is already processed with status: ${order.status}`);
    return;
  }

  // 네이버 결제 API 호출 (실제 구현 시 네이버 결제 API 사용)
  const paymentResult = await processNaverPayment(naverPaymentId);

  if (paymentResult.success) {
    // 결제 성공 - 상태 업데이트
    await ddb.putOrderDoc({
      ...order,
      status: "payment_completed",
      logs: [
        ...order.logs,
        {
          type: "payment_completed",
          timestamp: new Date().toISOString(),
          message: `네이버 결제 완료 (결제번호: ${naverPaymentId})`,
        },
      ],
    });
    
    console.log(`Payment completed for order: ${orderId}`);
  } else {
    // 결제 실패 - 상태 업데이트
    await ddb.putOrderDoc({
      ...order,
      status: "payment_failed",
      logs: [
        ...order.logs,
        {
          type: "payment_failed",
          timestamp: new Date().toISOString(),
          message: `네이버 결제 실패: ${paymentResult.error}`,
        },
      ],
    });
    
    console.error(`Payment failed for order: ${orderId}, reason: ${paymentResult.error}`);
  }
}

// 이메일 발송 핸들러
async function handleEmailSending(
  req: QueueSpec["sendEmail"]["req"],
  metadata: QueueMessageMetadata
) {
  const { to, subject, body } = req;
  
  console.log(`Sending email to: ${to}, subject: ${subject}`);
  
  // TODO: 실제 이메일 발송 구현 (SES, SendGrid 등)
  // 현재는 로그만 출력
  console.log(`Email sent successfully to: ${to}`);
}

// 환불 처리 핸들러
async function handleRefundProcessing(
  req: QueueSpec["processRefund"]["req"],
  metadata: QueueMessageMetadata
) {
  const { orderId, amount, reason } = req;
  
  console.log(`Processing refund for order: ${orderId}, amount: ${amount}, reason: ${reason}`);
  
  // TODO: 실제 환불 처리 구현
  // 현재는 로그만 출력
  console.log(`Refund processed successfully for order: ${orderId}`);
}

// 알림 발송 핸들러
async function handleNotificationSending(
  req: QueueSpec["sendNotification"]["req"],
  metadata: QueueMessageMetadata
) {
  const { userId, title, message, type } = req;
  
  console.log(`Sending notification to user: ${userId}, type: ${type}, title: ${title}`);
  
  // TODO: 실제 푸시 알림 발송 구현
  // 현재는 로그만 출력
  console.log(`Notification sent successfully to user: ${userId}`);
}

// 네이버 결제 API 호출 (실제 구현 시 네이버 결제 API 사용)
async function processNaverPayment(naverPaymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: 실제 네이버 결제 API 호출 구현
    console.log(`Processing naver payment: ${naverPaymentId}`);
    
    // 임시로 랜덤하게 성공/실패 결정 (실제 환경에서는 제거)
    const isSuccess = Math.random() > 0.1; // 90% 성공률
    
    if (isSuccess) {
      return { success: true };
    } else {
      return { success: false, error: "Payment processing failed" };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}