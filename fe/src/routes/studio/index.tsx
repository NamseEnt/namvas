import { createFileRoute } from "@tanstack/react-router";
import StudioPage from "@/components/pages/studio";

export const Route = createFileRoute("/studio/")({
  validateSearch: (search: Record<string, unknown>) => ({
    artwork: search.artwork as string | undefined,
  }),
  component: StudioPage,
});
