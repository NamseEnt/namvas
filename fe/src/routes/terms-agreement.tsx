import { createFileRoute } from "@tanstack/react-router";
import { TermsAgreementPage } from "@/components/pages/TermsAgreementPage";

export const Route = createFileRoute("/terms-agreement")({
  component: TermsAgreementPage,
});
