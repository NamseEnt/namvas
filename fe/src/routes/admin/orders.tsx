import { createFileRoute } from "@tanstack/react-router";
import { AdminOrdersPage } from "@/components/pages/admin/AdminOrdersPage";
import type { OrderStatus } from "../../../../shared/types";

function isValidOrderStatus(status: string | undefined): status is OrderStatus | undefined {
  if (status === undefined) {return true;}
  return ['payment_pending', 'payment_completed', 'payment_failed', 'in_production', 'shipping', 'delivered', 'production_hold'].includes(status);
}

function AdminOrdersComponent() {
  const { status, search, page } = Route.useSearch();
  return <AdminOrdersPage status={status} search={search} page={page} />;
}

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersComponent,
  validateSearch: (search: Record<string, unknown>) => {
    const statusParam = search.status as string | undefined;
    return {
      status: isValidOrderStatus(statusParam) ? statusParam : undefined,
      search: search.search as string | undefined,
      page: search.page ? Number(search.page) : 1,
    };
  },
});