import { createFileRoute } from "@tanstack/react-router";
import { ArtworksPage } from "@/components/pages/ArtworksPage";
import { AuthGuard } from "@/components/common/AuthGuard";

export const Route = createFileRoute("/artworks")({
  component: () => (
    <AuthGuard>
      <ArtworksPage />
    </AuthGuard>
  ),
});
