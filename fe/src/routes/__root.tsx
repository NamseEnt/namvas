import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { DropdownGNB } from "@/components/common/DropdownGNB";
import { PageFooter } from "@/components/common/PageFooter";
import { Toaster } from "@/components/ui/sonner";
import { LoginIntentProvider } from "@/contexts/LoginIntentContext";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <LoginIntentProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <DropdownGNB />
        <main className="flex-1 pt-14">
          <Outlet />
        </main>
        <PageFooter />
        <Toaster />
      </div>
    </LoginIntentProvider>
  );
}
