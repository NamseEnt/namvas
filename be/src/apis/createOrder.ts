import type { ApiSpec } from "shared/apiSpec";
import { putOrder, getSession } from "db";

async function generateUUID(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORDER-${timestamp}${random}`;
}

function calculateTotalAmount(quantity: number, hasPlasticStand: boolean): number {
  const basePrice = 10000;
  const plasticStandPrice = hasPlasticStand ? 250 : 0;
  const shippingFee = 3000;
  
  return (basePrice * quantity) + plasticStandPrice + shippingFee;
}

export async function createOrder(
  req: ApiSpec["createOrder"]["req"],
  context: { cookies: Map<string, string> }
): Promise<ApiSpec["createOrder"]["res"]> {
  try {
    const sessionId = context.cookies.get("session_id");
    if (!sessionId) {
      return { ok: false, reason: "INTERNAL_ERROR" };
    }

    const session = await getSession({ id: sessionId });
    if (!session) {
      return { ok: false, reason: "INTERNAL_ERROR" };
    }

    const orderId = await generateUUID();
    const orderNumber = generateOrderNumber();
    const totalAmount = calculateTotalAmount(req.quantity, req.hasPlasticStand);
    const now = new Date().toISOString();

    await putOrder({
      id: orderId,
      orderNumber,
      userId: session.userId,
      orderDate: now,
      finalAmount: totalAmount.toString(),
      status: "payment_completed",
      quantity: req.quantity.toString(),
      hasPlasticStand: req.hasPlasticStand.toString(),
      artworkDefinition: JSON.stringify(req.artworkDefinition),
      textureUrl: req.textureUrl,
      printImageUrl: "",
      thumbnailUrl: "",
      trackingNumber: "",
      adminMemo: "",
      deliveryMemo: req.deliveryMemo || "",
      recipient: JSON.stringify(req.recipient),
      createdAt: now,
      updatedAt: now,
    });

    return {
      ok: true,
      orderId,
      orderNumber,
      totalAmount,
    };
  } catch (error) {
    console.error("Create order error:", error);
    return { ok: false, reason: "INTERNAL_ERROR" };
  }
}