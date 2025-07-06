import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { getSession } from "../session";

export const confirmPayment = async (
  { paymentId }: ApiSpec["confirmPayment"]["req"],
  req: ApiRequest
): Promise<ApiSpec["confirmPayment"]["res"]> => {
  // 세션 확인
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "INTERNAL_ERROR" };
  }

  try {
    // paymentRequestId로 주문 찾기
    // TODO: 실제로는 paymentRequestId로 인덱스 조회가 필요하지만, 
    // 현재는 간단히 구현 (실제 환경에서는 GSI 필요)
    
    // 임시로 네이버페이 API 호출하여 결제 상태 확인
    const paymentResult = await checkNaverPaymentStatus(paymentId);
    
    if (!paymentResult.found) {
      return { ok: false, reason: "PAYMENT_NOT_FOUND" };
    }

    const { orderId, status: paymentStatus, naverPaymentId } = paymentResult;

    // 주문 조회
    const order = await ddb.getOrderDoc({ id: orderId });
    if (!order) {
      return { ok: false, reason: "PAYMENT_NOT_FOUND" };
    }

    // 주문 소유자 확인
    if (order.userId !== session.userId) {
      return { ok: false, reason: "PAYMENT_NOT_FOUND" };
    }

    // 결제 상태에 따라 주문 상태 업데이트
    let newStatus: "payment_completed" | "payment_failed";
    let logMessage: string;

    if (paymentStatus === "success") {
      newStatus = "payment_completed";
      logMessage = `네이버 결제 완료 (결제번호: ${naverPaymentId})`;
    } else {
      newStatus = "payment_failed";
      logMessage = `네이버 결제 실패 (결제번호: ${naverPaymentId})`;
    }

    // 주문 상태 업데이트
    const updatedOrder = {
      ...order,
      naverPaymentId: naverPaymentId || "",
      status: newStatus,
      logs: [
        ...order.logs,
        {
          type: newStatus,
          timestamp: new Date().toISOString(),
          message: logMessage
        }
      ]
    };

    await ddb.putOrderDoc(updatedOrder);

    return {
      ok: true,
      orderId,
      status: paymentStatus
    };

  } catch (error) {
    console.error("Payment confirmation error:", error);
    return { ok: false, reason: "INTERNAL_ERROR" };
  }
};

// 네이버페이 결제 상태 확인 (실제 구현 시 네이버페이 API 사용)
async function checkNaverPaymentStatus(paymentId: string): Promise<{
  found: boolean;
  orderId?: string;
  status?: "success" | "failed" | "pending";
  naverPaymentId?: string;
}> {
  try {
    // TODO: 실제 네이버페이 API 호출
    console.log(`Checking payment status for: ${paymentId}`);
    
    // 임시로 랜덤하게 성공/실패 결정 (실제 환경에서는 제거)
    const isSuccess = Math.random() > 0.2; // 80% 성공률
    
    // paymentId를 orderId로 가정 (실제로는 매핑 테이블이 필요)
    const orderId = paymentId;
    
    return {
      found: true,
      orderId,
      status: isSuccess ? "success" : "failed",
      naverPaymentId: `naver_${Date.now()}`
    };
  } catch (error) {
    console.error("Naver payment status check error:", error);
    return { found: false };
  }
}