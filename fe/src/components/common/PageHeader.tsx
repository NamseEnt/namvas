import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title = "NAMVAS", actions }: PageHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
          </div>
          {actions ? (
            <div className="flex gap-3">{actions}</div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="/artworks">내 작품</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/my">주문내역</a>
              </Button>
              <Button variant="outline" size="sm">
                로그아웃
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}