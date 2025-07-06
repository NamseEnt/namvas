import { X } from "lucide-react";

export function PageFooter() {
  return (
    <footer className="border-t bg-card mt-16">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center gap-8">
          <a
            href="https://x.com/messages/compose?recipient_id=NAMVAS_X_ID"
            className="text-muted-foreground hover:text-sky-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <X className="w-5 h-5" />
          </a>
          <div className="flex gap-6 text-sm">
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              서비스 이용약관
            </a>
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}