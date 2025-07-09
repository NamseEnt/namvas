import { createFileRoute } from "@tanstack/react-router";
import { OrderCompletePage } from "@/components/pages/OrderCompletePage";
import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/order-complete")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: search.orderId as string | undefined,
    amount: search.amount as string | undefined,
  }),
  component: function OrderCompleteComponent() {
    const { orderId, amount } = Route.useSearch();
    return (
      <AuthGuard>
        <OrderCompletePage orderId={orderId} amount={amount} />
      </AuthGuard>
    );
  },
});