import { createFileRoute } from "@tanstack/react-router";
import { OrderCompletePage } from "@/components/pages/OrderCompletePage";

export const Route = createFileRoute("/order-complete")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: search.orderId as string | undefined,
    amount: search.amount as string | undefined,
  }),
  component: function OrderCompleteComponent() {
    const { orderId, amount } = Route.useSearch();
    return <OrderCompletePage orderId={orderId} amount={amount} />;
  },
});