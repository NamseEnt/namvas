import { createFileRoute } from "@tanstack/react-router";
import StudioPage from "@/components/pages/studio";

const studioSearchSchema = {
  artwork: {
    optional: true,
  } as const,
} as const;

export const Route = createFileRoute("/studio/")({
  validateSearch: studioSearchSchema,
  component: StudioPage,
});
