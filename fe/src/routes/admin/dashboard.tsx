import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/components/pages/admin/AdminDashboardPage";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});