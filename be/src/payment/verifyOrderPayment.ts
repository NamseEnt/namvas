import { ddb } from "../__generated/db";
import { config } from "../config";
import { calculateTotalPayAmount } from "./calculateTotalPayAmount";

export async function verifyOrderPayment({ orderId }: { orderId: string }) {
  const orderDoc = await ddb.getOrderDoc({ id: orderId });

  if (!orderDoc) {
    throw new Error(`Order not found: ${orderId}`);
  }

  if (orderDoc.status !== "payment_verifing") {
    return;
  }

  const response = await fetch(
    `${config.NAVER_PAY_API_URL}/${config.NAVER_PAY_PARTNER_ID}/naverpay/payments/v2.2/apply/payment`,
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
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to verify order payment: ${
        response.statusText
      } ${await response.text()}`
    );
  }

  const {
    code,
    message,
    body: {
      detail: { totalPayAmount },
    },
  } = (await response.json()) as NaverPayResponse;

  switch (code) {
    case Code.Success:
    case Code.AlreadyComplete:
    case Code.AlreadyOnGoing:
      {
        const orderTotalPayAmount = calculateTotalPayAmount(orderDoc);
        if (orderTotalPayAmount !== totalPayAmount) {
          throw new Error(
            `Order total pay amount mismatch: ${orderTotalPayAmount} !== ${totalPayAmount}`
          );
        }
        orderDoc.status = "waiting_start_production";
        orderDoc.logs.push({
          type: "payment_verification_completed",
          timestamp: new Date().toISOString(),
          message: ``,
        });
        await ddb.updateOrderDoc(orderDoc);
      }
      break;
    case Code.InvalidMerchant: {
      throw new Error(`unreachable - ${code}`);
    }
    case Code.Fail:
    case Code.TimeExpired:
    case Code.OwnerAuthFail:
    case Code.BankMaintenance:
    case Code.NotEnoughAccountBalance:
    case Code.MaintenanceOngoing:
    case Code.FaultCheckOngoing: {
      orderDoc.logs.push({
        type: "payment_verification_failed",
        timestamp: new Date().toISOString(),
        message: `${code} - ${message}`,
      });
      await ddb.updateOrderDoc(orderDoc);
    }
  }
}

type NaverPayResponse = {
  code: Code;
  message: string;
  body: {
    detail: {
      totalPayAmount: number;
    };
  };
};

enum Code {
  Success = "Success",
  Fail = "Fail",
  InvalidMerchant = "InvalidMerchant",
  TimeExpired = "TimeExpired",
  AlreadyOnGoing = "AlreadyOnGoing",
  AlreadyComplete = "AlreadyComplete",
  OwnerAuthFail = "OwnerAuthFail",
  BankMaintenance = "BankMaintenance",
  NotEnoughAccountBalance = "NotEnoughAccountBalance",
  MaintenanceOngoing = "MaintenanceOngoing",
  FaultCheckOngoing = "FaultCheckOngoing",
}
