import { createFileRoute } from "@tanstack/react-router";
import { OrderPage } from "@/components/pages/OrderPage";

function OrderPageComponent() {
  const { fromStudio, fromBuildOrder } = Route.useSearch();
  return <OrderPage fromStudio={fromStudio} fromBuildOrder={fromBuildOrder} />;
}

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromStudio: search.fromStudio as string | undefined,
    fromBuildOrder: search.fromBuildOrder as string | undefined,
  }),
  component: OrderPageComponent,
});