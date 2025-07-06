import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createContext, useContext, useState, useEffect } from "react";
import { X, Edit, Trash2, Copy, Plus } from "lucide-react";
import { userApi } from "@/lib/api";
import type { SavedArtwork } from "../../../shared/types";

export const Route = createFileRoute("/artworks")({
  component: ArtworksPage,
});

type ArtworksPageState = {
  artworks: SavedArtwork[];
  isLoading: boolean;
};

const ArtworksPageContext = createContext<{
  state: ArtworksPageState;
  updateState: (updates: Partial<ArtworksPageState>) => void;
  handleDeleteArtwork: (artworkId: string) => void;
  handleDuplicateArtwork: (artworkId: string, title: string) => void;
  loadArtworks: () => Promise<void>;
}>(null as any);

const useArtworksPageContext = () => useContext(ArtworksPageContext);

export default function ArtworksPage() {
  const [state, setState] = useState<ArtworksPageState>({
    artworks: [],
    isLoading: true,
  });

  const updateState = (updates: Partial<ArtworksPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const loadArtworks = async () => {
    try {
      updateState({ isLoading: true });
      const response = await userApi.getMyArtworks();
      updateState({ artworks: response.artworks, isLoading: false });
    } catch (error) {
      console.error("Failed to load artworks:", error);
      updateState({ isLoading: false });
    }
  };

  const handleDeleteArtwork = async (artworkId: string) => {
    try {
      await userApi.deleteArtwork(artworkId);
      updateState({ 
        artworks: state.artworks.filter(artwork => artwork.id !== artworkId) 
      });
    } catch (error) {
      console.error("Failed to delete artwork:", error);
    }
  };

  const handleDuplicateArtwork = async (artworkId: string, title: string) => {
    try {
      const response = await userApi.duplicateArtwork(artworkId, title);
      await loadArtworks(); // Reload to get the new artwork
    } catch (error) {
      console.error("Failed to duplicate artwork:", error);
    }
  };

  useEffect(function loadArtworksOnMount() {
    loadArtworks();
  }, []);

  return (
    <ArtworksPageContext.Provider
      value={{
        state,
        updateState,
        handleDeleteArtwork,
        handleDuplicateArtwork,
        loadArtworks,
      }}
    >
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">내 작품</h1>
            <p className="text-muted-foreground mt-2">저장된 작품을 관리하고 새로운 주문을 만들어보세요</p>
          </div>
          <ArtworksSection />
        </div>
        <PageFooter />
      </div>
    </ArtworksPageContext.Provider>
  );
}

function PageHeader() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              NAMVAS
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="/my">주문내역</a>
            </Button>
            <Button variant="outline" size="sm">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function ArtworksSection() {
  const { state } = useArtworksPageContext();

  if (state.isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">작품을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (state.artworks.length === 0) {
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
            총 {state.artworks.length}개 작품
          </span>
          <Button variant="outline" size="sm" asChild>
            <a href="/create-order">주문서 만들기</a>
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
        {state.artworks.map((artwork) => (
          <ArtworkItem key={artwork.id} artwork={artwork} />
        ))}
      </div>
    </div>
  );
}

function ArtworkItem({ artwork }: { artwork: SavedArtwork }) {
  const { handleDeleteArtwork, handleDuplicateArtwork } = useArtworksPageContext();

  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={`https://your-s3-bucket.s3.amazonaws.com/${artwork.thumbnailS3Key}`}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg truncate">{artwork.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(artwork.updatedAt)}
            </p>
          </div>
          <ArtworkActions artwork={artwork} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            편집
          </Button>
          <Button size="sm" className="flex-1" asChild>
            <a href="/create-order">주문하기</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArtworkActions({ artwork }: { artwork: SavedArtwork }) {
  const { handleDeleteArtwork, handleDuplicateArtwork } = useArtworksPageContext();

  return (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleDuplicateArtwork(artwork.id, `${artwork.title} (복사본)`)}
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
              "{artwork.title}" 작품이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteArtwork(artwork.id)}
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

function PageFooter() {
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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}