import { createFileRoute } from "@tanstack/react-router";
import { getMeQueryOptions } from "@/hooks/useAuth";
import { LandingPage } from "@/components/pages/LandingPage";
import { DashboardPage } from "@/components/pages/DashboardPage";

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async ({ context }) =>
    context.queryClient.fetchQuery(getMeQueryOptions),
});

function HomePage() {
  const { ok } = Route.useLoaderData();
  return ok ? <DashboardPage /> : <LandingPage />;
}
