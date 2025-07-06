import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { getSession } from "../session";
import { generateId } from "../utils/uuid";

export const createOrder = async (
  { orderItems, plasticStandCount, plasticStandPrice, totalPrice, recipient }: ApiSpec["createOrder"]["req"],
  req: ApiRequest
): Promise<ApiSpec["createOrder"]["res"]> => {
  // 세션 확인
  const session = await getSession(req);
  if (!session) {
    return { ok: false, reason: "INTERNAL_ERROR" };
  }

  // 요청 검증
  if (orderItems.length === 0) {
    return { ok: false, reason: "INVALID_REQUEST" };
  }

  // 가격 검증
  const itemsTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const plasticStandTotal = plasticStandCount * plasticStandPrice;
  const calculatedTotal = itemsTotal + plasticStandTotal;
  
  if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
    return { ok: false, reason: "INVALID_REQUEST" };
  }

  try {
    const orderId = generateId();
    const paymentRequestId = generateId();

    // rows 구성 - artwork와 plasticStand 모두 포함
    const rows = [];
    
    // artwork 아이템들 추가
    for (const orderItem of orderItems) {
      // TODO: artworkId로 실제 artwork 정보 조회
      // 현재는 임시로 기본값 사용 (실제로는 artworkId로 ArtworkDoc 조회해서 전체 정보 가져와야 함)
      const artwork = await ddb.getArtworkDoc({ id: orderItem.artworkId });
      if (!artwork) {
        return { ok: false, reason: "INVALID_REQUEST" };
      }

      rows.push({
        item: {
          type: "artwork" as const,
          title: artwork.title,
          originalImageId: artwork.originalImageId,
          dpi: artwork.dpi,
          imageCenterXy: artwork.imageCenterXy,
          sideProcessing: artwork.sideProcessing
        },
        count: orderItem.quantity,
        price: orderItem.price
      });
    }

    // plasticStand 아이템 추가
    if (plasticStandCount > 0) {
      rows.push({
        item: {
          type: "plasticStand" as const
        },
        count: plasticStandCount,
        price: plasticStandPrice
      });
    }

    // 주문 생성 (payment_pending 상태)
    const newOrder = {
      $v: 1,
      id: orderId,
      userId: session.userId,
      paymentRequestId,
      naverPaymentId: "", // 아직 네이버 결제 ID 없음
      rows,
      recipient,
      status: "payment_pending" as const,
      logs: [
        {
          type: "payment_pending" as const,
          timestamp: new Date().toISOString(),
          message: "주문 생성 및 결제 대기 중"
        }
      ]
    };

    await ddb.putOrderDoc(newOrder);

    // 네이버페이 결제 URL 생성 (실제로는 네이버페이 API 호출)
    const paymentUrl = `https://pay.naver.com/payments/${paymentRequestId}`;

    return {
      ok: true,
      orderId,
      paymentUrl,
      paymentRequestId
    };
  } catch (error) {
    console.error("Order creation error:", error);
    return { ok: false, reason: "INTERNAL_ERROR" };
  }
};