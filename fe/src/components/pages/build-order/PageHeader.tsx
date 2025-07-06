import { Button } from "@/components/ui/button";
import { PageHeader as CommonPageHeader } from "@/components/common/PageHeader";

export function PageHeader() {
  const actions = (
    <>
      <Button variant="outline" size="sm" asChild>
        <a href="/artworks">내 작품</a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href="/my">주문내역</a>
      </Button>
      <Button variant="outline" size="sm">
        로그아웃
      </Button>
    </>
  );

  return <CommonPageHeader actions={actions} />;
}