import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Artwork } from "../../../../../shared/types";

type ArtworksSectionProps = {
  artworks: Artwork[];
  isLoading: boolean;
  onAddToOrder: (artwork: Artwork) => void;
};

export function ArtworksSection({ artworks, isLoading, onAddToOrder }: ArtworksSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>내 작품</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">작품을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (artworks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>내 작품</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">저장된 작품이 없습니다</p>
          <Button className="mt-4" asChild>
            <a href="/studio">첫 작품 만들기</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>내 작품</span>
          <Badge variant="secondary">{artworks.length}개</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} onAddToOrder={onAddToOrder} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ArtworkCard({ artwork, onAddToOrder }: { artwork: Artwork; onAddToOrder: (artwork: Artwork) => void }) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={`https://your-s3-bucket.s3.amazonaws.com/${artwork.originalImageId}`}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm truncate mb-2">{artwork.title}</h3>
        <Button 
          size="sm" 
          className="w-full"
          onClick={() => onAddToOrder(artwork)}
        >
          <Plus className="w-4 h-4 mr-1" />
          주문에 추가
        </Button>
      </CardContent>
    </Card>
  );
}