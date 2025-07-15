import { createFileRoute } from "@tanstack/react-router";
import StudioPage from "@/components/pages/studio/StudioPage";
import { StudioContextProvider } from "@/components/pages/studio/StudioContext";
// import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/studio/")({
  component: () => (
    // <AuthGuard>
    <StudioContextProvider>
      <StudioPage />
    </StudioContextProvider>
    // </AuthGuard>
  ),
});
