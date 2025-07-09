import { createFileRoute } from "@tanstack/react-router";
import StudioPage from "@/components/pages/studio";
import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/studio/")({
  component: () => (
    <AuthGuard>
      <StudioPage />
    </AuthGuard>
  ),
});
