import { createFileRoute } from "@tanstack/react-router";
import { OrderPage } from "@/components/pages/OrderPage";
import { AuthGuard } from "@/components/common/AuthGuard";

function OrderPageComponent() {
  const { fromStudio, fromBuildOrder } = Route.useSearch();
  return (
    <AuthGuard>
      <OrderPage fromStudio={fromStudio} fromBuildOrder={fromBuildOrder} />
    </AuthGuard>
  );
}

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromStudio: search.fromStudio as string | undefined,
    fromBuildOrder: search.fromBuildOrder as string | undefined,
  }),
  component: OrderPageComponent,
});