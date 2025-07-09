import { createFileRoute } from "@tanstack/react-router";
import { BuildOrderPage } from "@/components/pages/BuildOrderPage";
import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/build-order")({
  component: () => (
    <AuthGuard>
      <BuildOrderPage />
    </AuthGuard>
  ),
});
