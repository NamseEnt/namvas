import { QueueMessageSpec } from "../sqs";
import { ddb } from "../__generated/db";
import { config } from "../config";
import { isLocalDev } from "../isLocalDev";

// 네이버페이 결제 승인 API 응답 타입
interface NaverPaymentDetail {
  paymentId: string;
  payHistId: string;
  merchantName: string;
  merchantId: string;
  totalPayAmount: number;
  primaryPayAmount: number;
  npointPayAmount: number;
  taxScopeAmount: number;
  primaryPayMeans: "CARD" | "BANK";
  cardCorpCode?: string;
  productName: string;
  settleExpected: boolean;
  settleExpectAmount: number;
  payCommissionAmount: number;
  userIdentifier: string;
  extraDeduction: number;
  useCfmYmdt: string;
}

interface NaverPaymentApprovalResponse {
  code:
    | "Success"
    | "Fail"
    | "InvalidMerchant"
    | "TimeExpired"
    | "AlreadyOnGoing"
    | string;
  message?: string;
  body: {
    paymentId: string;
    detail: NaverPaymentDetail;
  };
}

export const processPayment = async ({
  orderId,
  naverPaymentId,
}: QueueMessageSpec["processPayment"]["req"]) => {
  console.log(
    `Processing payment for order: ${orderId}, naverPaymentId: ${naverPaymentId}`
  );

  // 주문 조회
  const order = await ddb.getOrderDoc({ id: orderId });
  if (!order) {
    console.error(`Order not found: ${orderId}`);
    return;
  }

  // 이미 처리된 주문인지 확인
  if (order.status !== "payment_pending") {
    console.log(
      `Order ${orderId} is already processed with status: ${order.status}`
    );
    return;
  }

  // 네이버페이 결제 확인 API 호출
  const paymentResult = await executeNaverPayment(naverPaymentId);

  if (paymentResult.success) {
    // 결제 성공 - 상태 업데이트
    await ddb.tx((tx) =>
      tx.updateOrderDoc({
        ...order,
        status: "payment_completed",
        logs: [
          ...order.logs,
          {
            type: "payment_completed",
            timestamp: new Date().toISOString(),
            message: `네이버페이 결제 승인 완료 (결제번호: ${paymentResult.naverPaymentId})`,
          },
        ],
      })
    );

    console.log(`Payment completed for order: ${orderId}`);
  } else {
    // 결제 실패 - 상태 업데이트
    await ddb.tx((tx) =>
      tx.updateOrderDoc({
        ...order,
        status: "payment_failed",
        logs: [
          ...order.logs,
          {
            type: "payment_failed",
            timestamp: new Date().toISOString(),
            message: `네이버페이 결제 승인 실패`,
          },
        ],
      })
    );

    console.error(`Payment failed for order: ${orderId}`);
  }
};

// 네이버페이 결제 승인 API 호출
async function executeNaverPayment(
  naverPaymentId: string
): Promise<
  | { success: false }
  | { success: true; naverPaymentId: string; totalPayAmount: number }
> {
  try {
    // 네이버페이 설정 확인
    if (
      !config.NAVER_PAY_PARTNER_ID ||
      !config.NAVER_PAY_CLIENT_ID ||
      !config.NAVER_PAY_CLIENT_SECRET ||
      !config.NAVER_PAY_CHAIN_ID
    ) {
      console.error("네이버페이 설정이 누락되었습니다");
      return { success: false };
    }

    // API 도메인 선택 (개발/운영)
    const apiDomain = isLocalDev()
      ? "dev-pub.apis.naver.com"
      : "apis.naver.com";

    // 네이버페이 결제 승인 API 호출
    const response = await fetch(
      `https://${apiDomain}/${config.NAVER_PAY_PARTNER_ID}/naverpay/payments/v2.2/apply/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Naver-Client-Id": config.NAVER_PAY_CLIENT_ID,
          "X-Naver-Client-Secret": config.NAVER_PAY_CLIENT_SECRET,
          "X-NaverPay-Chain-Id": config.NAVER_PAY_CHAIN_ID,
          "X-NaverPay-Idempotency-Key": naverPaymentId.substring(0, 64),
        },
        body: JSON.stringify({
          paymentId: naverPaymentId,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "네이버페이 API 호출 실패:",
        response.status,
        response.statusText
      );
      return { success: false };
    }

    const result = (await response.json()) as NaverPaymentApprovalResponse;

    // 결제 승인 성공 여부 확인
    if (result.code === "Success") {
      return {
        success: true,
        naverPaymentId: result.body.detail.paymentId,
        totalPayAmount: result.body.detail.totalPayAmount,
      };
    } else {
      console.error("네이버페이 결제 승인 실패:", result.code, result.message);
      return { success: false };
    }
  } catch (error) {
    console.error("네이버페이 API 호출 오류:", error);
    return { success: false };
  }
}
