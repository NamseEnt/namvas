import { createFileRoute } from "@tanstack/react-router";
import { MyPage } from "@/components/pages/MyPage";
import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/my")({
  component: () => (
    <AuthGuard>
      <MyPage />
    </AuthGuard>
  ),
});