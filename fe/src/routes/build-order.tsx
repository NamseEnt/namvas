import { createFileRoute } from "@tanstack/react-router";
import { BuildOrderPage } from "@/components/pages/BuildOrderPage";

export const Route = createFileRoute("/build-order")({
  component: BuildOrderPage,
});
