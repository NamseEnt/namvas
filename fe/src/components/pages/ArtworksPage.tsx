import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { Plus } from "lucide-react";
// import type { Artwork } from "../../../shared/types";

// 임시 타입 정의 (원래 shared에서 가져와야 함)
type Artwork = {
  id: string;
  title: string;
  originalImageId: string;
  dpi: number;
  imageCenterXyInch: { x: number; y: number };
  sideProcessing: any;
  createdAt: string;
  canvasBackgroundColor: string;
};
import { useArtworks } from "@/hooks/useArtworks";
// import { CanvasView } from "@/components/common/CanvasView";
// import { getImageUrl } from "@/lib/config";

export function ArtworksPage() {
  const { artworks, isLoading, loadArtworks } = useArtworks();

  useEffect(
    function loadArtworksOnMount() {
      loadArtworks();
    },
    [loadArtworks]
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">내 작품</h1>
        <p className="text-muted-foreground mt-2">
          저장된 작품을 관리하고 새로운 주문을 만들어보세요
        </p>
      </div>
      <ArtworksSection artworks={artworks} isLoading={isLoading} />
    </div>
  );
}

function ArtworksSection({
  artworks,
  isLoading,
}: {
  artworks: Artwork[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">작품을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (artworks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            저장된 작품이 없습니다
          </p>
          <Button className="mt-4" asChild>
            <a href="/studio">첫 작품 만들기</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">저장된 작품</h2>
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground">
            총 {artworks.length}개 작품
          </span>
          <Button variant="outline" size="sm" asChild>
            <a href="/build-order">주문서 만들기</a>
          </Button>
          <Button size="sm" asChild>
            <a href="/studio">
              <Plus className="w-4 h-4 mr-2" />새 작품 만들기
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {artworks.map((artwork) => (
          <ArtworkItem key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  );
}

function ArtworkItem({ artwork }: { artwork: Artwork }) {
  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-slate-300">
      <div className="p-4">
        <h3 className="font-medium text-slate-900 group-hover:text-slate-600 transition-colors truncate">
          {artwork.title}
        </h3>
      </div>
      <div className="aspect-square overflow-hidden bg-slate-100">
        {/* TODO: 새로운 CanvasView 인터페이스에 맞게 수정 예정 */}
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-sm text-gray-500">미리보기</span>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
    </div>
  );
}
