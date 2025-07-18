import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/pages/LandingPage";

export const Route = createFileRoute("/")({
  component: LandingPage,
});