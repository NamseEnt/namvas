import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

export default function AdminIndex() {
  return <Navigate to="/admin/dashboard" />;
}