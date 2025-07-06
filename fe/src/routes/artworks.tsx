import { createFileRoute } from "@tanstack/react-router";
import { ArtworksPage } from "@/components/pages/ArtworksPage";

export const Route = createFileRoute("/artworks")({
  component: ArtworksPage,
});
