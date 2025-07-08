import { ddb } from "../__generated/db";
import { config } from "../config";
import { OrderDoc } from "../schema";

const alreadyCanceledStatuses: OrderDoc["status"][] = [
  "payment_canceled",
  "payment_cancel_rejected",
];
const cancelableStatuses: OrderDoc["status"][] = [
  "payment_verifing",
  "payment_failed",
  "waiting_start_production",
];

export async function cancelOrder({ orderId }: { orderId: string }) {
  const orderDoc = await ddb.getOrderDoc({ id: orderId });

  if (!orderDoc) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (alreadyCanceledStatuses.includes(orderDoc.status)) {
    return;
  }

  if (!cancelableStatuses.includes(orderDoc.status)) {
    throw new Error(`Order is not cancelable: ${orderDoc.status}`);
  }

  orderDoc.status = "payment_cancelling";

  const cancelAmount = calculateTotalPayAmount(orderDoc);

  const response = await fetch(
    `${config.NAVER_PAY_API_URL}/${config.NAVER_PAY_PARTNER_ID}/naverpay/payments/v1/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Naver-Client-Id": config.NAVER_PAY_CLIENT_ID,
        "X-Naver-Client-Secret": config.NAVER_PAY_CLIENT_SECRET,
        "X-NaverPay-Chain-Id": config.NAVER_PAY_CHAIN_ID,
        "X-NaverPay-Idempotency-Key": orderDoc.naverPaymentId,
      },
      body: new URLSearchParams({
        paymentId: orderDoc.naverPaymentId,
        cancelAmount: cancelAmount.toString(),
        cancelReason: "user requested",
        cancelRequester: "2",
        taxScopeAmount: cancelAmount.toString(),
        taxExScopeAmount: "0",
        doCompareRest: "1",
        expectedRestAmount: "0",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to cancel order: ${response.statusText} ${await response.text()}`
    );
  }

  const { code, message } = (await response.json()) as NaverPayResponse;

  switch (code) {
    case Code.Success:
    case Code.AlreadyCanceled:
    case Code.AlreadyOnGoing:
    case Code.CancelNotComplete:
      {
        orderDoc.status = "payment_canceled";
        orderDoc.logs.push({
          type: "payment_canceled",
          timestamp: new Date().toISOString(),
          message: ``,
        });
        await ddb.updateOrderDoc(orderDoc);
      }
      break;
    case Code.InvalidMerchant:
    case Code.InvalidPaymentId:
    case Code.OverRemainAmount:
    case Code.PreCancelNotComplete:
    case Code.TaxScopeAmtGreaterThanRemainError:
    case Code.TaxScopeAmountError:
    case Code.RestAmountDiff:
      throw new Error(`unreachable - ${code}`);

    case Code.CancelDeadlineExpired:
    case Code.InvalidDiscountCancelCondition:
      {
        orderDoc.status = "payment_cancel_rejected";
        orderDoc.logs.push({
          type: "payment_cancel_rejected",
          timestamp: new Date().toISOString(),
          message: `${code} - ${message}`,
        });
        await ddb.updateOrderDoc(orderDoc);
      }
      break;

    case Code.MaintenanceOngoing:
    case Code.FaultCheckOngoing:
      throw new Error(
        `payment cancel failed, retry later ${code} - ${message}`
      );
  }
}

type NaverPayResponse = {
  code: Code;
  message: string;
};

enum Code {
  // 성공
  Success = "Success",
  // 유효하지 않은 가맹점
  InvalidMerchant = "InvalidMerchant",
  // 유효하지 않은 네이버페이 결제번호
  InvalidPaymentId = "InvalidPaymentId",
  // 이미 전체 취소된 결제
  AlreadyCanceled = "AlreadyCanceled",
  // 취소 요청 금액이 잔여 결제 금액을 초과
  OverRemainAmount = "OverRemainAmount",
  // 이전에 요청한 취소가 완료되지 않은 상태
  // 이전에 요청했던 취소 정보로 재시도 요청해야 이전 취소가 완료되고 다음 취소를 수행할 수 있습니다.
  PreCancelNotComplete = "PreCancelNotComplete",
  // 취소 기한이 만료되어 취소가 불가합니다. 가맹점의 자체 환불이 필요합니다.
  CancelDeadlineExpired = "CancelDeadlineExpired",
  // 취소 가능한 과면세 금액보다 큰 금액 요청
  TaxScopeAmtGreaterThanRemainError = "TaxScopeAmtGreaterThanRemainError",
  // 과면세 및 컵 보증금 금액의 합이 취소 요청 금액과 다른 상태
  // 과세 대상 금액 + 면세 대상 금액 + 컵 보증금 대상 금액 (옵션) = 취소 요청 금액
  TaxScopeAmountError = "TaxScopeAmountError",
  // 가맹점의 예상 잔여금액(expectedRestAmount)과 네이버페이의 잔여금액이 일치하지 않음
  RestAmountDiff = "RestAmountDiff",
  // 취소 처리가 완료되지 않았지만, 빠른 시일 내에 자동 취소 재처리 예정.
  CancelNotComplete = "CancelNotComplete",
  // 해당 결제번호로 요청이 이미 진행 중인 경우
  AlreadyOnGoing = "AlreadyOnGoing",
  // 서비스 점검중
  // (점검 종료 후 반드시 재시도 필요)
  MaintenanceOngoing = "MaintenanceOngoing",
  // 원천사 시스템 점검으로 해당 결제수단을 이용할 수 없을 때
  FaultCheckOngoing = "FaultCheckOngoing",
  // 즉시 할인 정책에 따라 취소가 불가합니다.
  InvalidDiscountCancelCondition = "InvalidDiscountCancelCondition",
}
function calculateTotalPayAmount(orderDoc: OrderDoc) {
  let totalPayAmount = 0;
  for (const item of orderDoc.rows) {
    totalPayAmount += item.price * item.count;
  }
  return totalPayAmount;
}
