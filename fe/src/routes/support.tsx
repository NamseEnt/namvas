import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-8">고객센터</h1>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-lg text-gray-700 mb-4">
          문의사항이 있으신가요?
        </p>
        <p className="text-gray-600">
          이메일: support@namvas.com
        </p>
      </div>
    </div>
  );
}