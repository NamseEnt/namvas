import { createFileRoute } from "@tanstack/react-router";
import SimpleStudioPage from "@/components/pages/studio/SimpleStudioPage";
// import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/studio/")({
  component: () => (
    // <AuthGuard>
      <SimpleStudioPage />
    // </AuthGuard>
  ),
});