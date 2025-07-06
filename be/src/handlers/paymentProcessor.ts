import { SQSHandler } from "aws-lambda";
import { ddb } from "../__generated/db";

export const paymentProcessor: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { orderId, naverPaymentId } = message;

      console.log(`Processing payment for order: ${orderId}, naverPaymentId: ${naverPaymentId}`);

      // 주문 조회
      const order = await ddb.getOrderDoc({ id: orderId });
      if (!order) {
        console.error(`Order not found: ${orderId}`);
        continue;
      }

      // 이미 처리된 주문인지 확인
      if (order.status !== "payment_pending") {
        console.log(`Order ${orderId} is already processed with status: ${order.status}`);
        continue;
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
    } catch (error) {
      console.error("Error processing payment:", error);
      // SQS에서 메시지를 재시도하도록 에러를 던짐
      throw error;
    }
  }
};

// 네이버 결제 API 호출 (실제 구현 시 네이버 결제 API 사용)
async function processNaverPayment(naverPaymentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: 실제 네이버 결제 API 호출 구현
    // 현재는 성공으로 가정
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