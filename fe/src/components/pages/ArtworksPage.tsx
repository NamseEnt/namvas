import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Plus, Edit, Copy, FileText, Trash2 } from "lucide-react";
import type { Artwork } from "../../../../shared/types";
import { useArtworks } from "@/hooks/useArtworks";
import { CanvasView } from "../common/CanvasView";
import { getImageUrl } from "@/lib/config";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArtworkTitleEditModal } from "../common/ArtworkTitleEditModal";
import { useNavigate } from "@tanstack/react-router";

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
  const { deleteArtwork, duplicateArtwork, updateArtworkTitle } = useArtworks();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleEdit() {
    navigate({ to: "/studio" });
  }

  async function handleDuplicate() {
    try {
      setIsLoading(true);
      await duplicateArtwork(artwork.id, `${artwork.title} (복사본)`);
    } catch (error) {
      console.error("복제 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (confirm("정말로 이 작품을 삭제하시겠습니까?")) {
      try {
        setIsLoading(true);
        await deleteArtwork(artwork.id);
      } catch (error) {
        console.error("삭제 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function handleTitleSave(newTitle: string) {
    try {
      setIsLoading(true);
      await updateArtworkTitle(artwork.id, newTitle);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("제목 변경 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-slate-300">
            <div className="p-4">
              <h3 className="font-medium text-slate-900 group-hover:text-slate-600 transition-colors truncate">
                {artwork.title}
              </h3>
            </div>
            <div className="aspect-square overflow-hidden bg-slate-100">
              <CanvasView
                imageSource={getImageUrl(artwork.id)}
                rotation={{
                  x: 0,
                  y: 30,
                }}
                sideMode={artwork.sideMode}
                imageOffset={artwork.imageOffset}
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleEdit} disabled={isLoading}>
            <Edit className="w-4 h-4 mr-2" />
            편집
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDuplicate} disabled={isLoading}>
            <Copy className="w-4 h-4 mr-2" />
            복제
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setIsEditModalOpen(true)} disabled={isLoading}>
            <FileText className="w-4 h-4 mr-2" />
            이름 바꾸기
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      <ArtworkTitleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentTitle={artwork.title}
        onSave={handleTitleSave}
        isLoading={isLoading}
      />
    </>
  );
}
