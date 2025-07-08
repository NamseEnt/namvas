import { OrderDoc } from "../schema";

export function calculateTotalPayAmount(orderDoc: OrderDoc) {
  let totalPayAmount = 0;
  for (const item of orderDoc.rows) {
    totalPayAmount += item.price * item.count;
  }
  const deliveryFee = 3000;
  return totalPayAmount + deliveryFee;
}
