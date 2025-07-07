import { ApiSpec } from "shared";
import { ApiRequest } from "../types";
import { ddb } from "../__generated/db";
import { isAdmin } from "../session/adminCheck";

export const adminGetOrder = async (
  { orderId }: ApiSpec["adminGetOrder"]["req"],
  req: ApiRequest
): Promise<ApiSpec["adminGetOrder"]["res"]> => {
  if (!(await isAdmin(req))) {
    return { ok: false, reason: "NOT_ADMIN" };
  }

  try {
    const order = await ddb.getOrderDoc({ id: orderId });
    
    if (!order) {
      return { ok: false, reason: "ORDER_NOT_FOUND" };
    }

    // OrderDoc을 Order 타입으로 변환
    const convertedOrder = {
      id: order.id,
      orderDate: new Date().toISOString(), // 임시 값
      status: order.status as any,
      items: order.rows.map(row => ({
        artwork: row.item.type === "artwork" ? {
          id: order.id, // 임시 값
          title: row.item.title,
          originalImageId: row.item.originalImageId,
          dpi: row.item.dpi,
          imageCenterXy: row.item.imageCenterXy,
          sideProcessing: row.item.sideProcessing as any,
          thumbnailId: "", // 임시 값
          createdAt: new Date().toISOString(), // 임시 값
          canvasBackgroundColor: "#ffffff" // 임시 값
        } : {
          id: "", title: "", originalImageId: "", dpi: 0, 
          imageCenterXy: { x: 0, y: 0 }, sideProcessing: { type: "none" } as any,
          thumbnailId: "", createdAt: "", canvasBackgroundColor: "#ffffff"
        },
        quantity: row.count,
        price: row.price
      })),
      plasticStandCount: 0, // 임시 값
      plasticStandPrice: 0, // 임시 값
      totalPrice: order.rows.reduce((sum, row) => sum + row.price * row.count, 0),
      recipient: order.recipient,
      deliveryMemo: order.recipient.memo
    };

    return { ok: true, order: convertedOrder };
  } catch (error) {
    console.error("Failed to get order:", error);
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }
};