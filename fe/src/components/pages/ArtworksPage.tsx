import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEffect } from "react";
import { Trash2, Copy, Plus } from "lucide-react";
import type { Artwork } from "../../../../shared/types";
import { useArtworks } from "@/hooks/useArtworks";
import { PageHeader } from "@/components/common/PageHeader";
import { PageFooter } from "@/components/common/PageFooter";

export function ArtworksPage() {
  const { artworks, isLoading, loadArtworks, deleteArtwork, duplicateArtwork } = useArtworks();

  useEffect(function loadArtworksOnMount() {
    loadArtworks();
  }, [loadArtworks]);

  const handleDeleteArtwork = async (artworkId: string) => {
    await deleteArtwork(artworkId);
  };

  const handleDuplicateArtwork = async (artworkId: string, title: string) => {
    await duplicateArtwork(artworkId, title);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">내 작품</h1>
          <p className="text-muted-foreground mt-2">저장된 작품을 관리하고 새로운 주문을 만들어보세요</p>
        </div>
        <ArtworksSection 
          artworks={artworks}
          isLoading={isLoading}
          onDeleteArtwork={handleDeleteArtwork}
          onDuplicateArtwork={handleDuplicateArtwork}
        />
      </div>
      <PageFooter />
    </div>
  );
}

function ArtworksSection({ 
  artworks, 
  isLoading, 
  onDeleteArtwork, 
  onDuplicateArtwork 
}: {
  artworks: Artwork[];
  isLoading: boolean;
  onDeleteArtwork: (artworkId: string) => void;
  onDuplicateArtwork: (artworkId: string, title: string) => void;
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
          <p className="text-muted-foreground text-lg">저장된 작품이 없습니다</p>
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
              <Plus className="w-4 h-4 mr-2" />
              새 작품 만들기
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {artworks.map((artwork) => (
          <ArtworkItem 
            key={artwork.id} 
            artwork={artwork}
            onDelete={onDeleteArtwork}
            onDuplicate={onDuplicateArtwork}
          />
        ))}
      </div>
    </div>
  );
}

function ArtworkItem({ 
  artwork, 
  onDelete, 
  onDuplicate 
}: { 
  artwork: Artwork;
  onDelete: (artworkId: string) => void;
  onDuplicate: (artworkId: string, title: string) => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={`https://your-s3-bucket.s3.amazonaws.com/${artwork.thumbnailId}`}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg truncate">{artwork.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(artwork.createdAt)}
            </p>
          </div>
          <ArtworkActions 
            artwork={artwork} 
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            편집
          </Button>
          <Button size="sm" className="flex-1" asChild>
            <a href="/build-order">주문하기</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArtworkActions({ 
  artwork, 
  onDelete, 
  onDuplicate 
}: { 
  artwork: Artwork;
  onDelete: (artworkId: string) => void;
  onDuplicate: (artworkId: string, title: string) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onDuplicate(artwork.id, `${artwork.title} (복사본)`)}
      >
        <Copy className="w-4 h-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작품을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{artwork.title}&quot; 작품이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(artwork.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}