import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import type { Artwork, SideProcessing } from "../../../shared/types";
import { createCrossTexture } from "@/components/pages/studio/canvas-views/createCrossTexture";

type SaveArtworkData = {
  title: string;
  imageDataUrl: string;
  uploadedImage: HTMLImageElement;
  mmPerPixel: number;
  imageCenterXy: { x: number; y: number };
  sideProcessing: SideProcessing;
  canvasTextureImg: HTMLImageElement;
};

export function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const loadArtworks = useCallback(async (pageToken?: string) => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await userApi.listMyArtworks({
        pageSize: 20,
        nextToken: pageToken,
      });
      
      if (pageToken) {
        setArtworks(prev => [...prev, ...response.artworks.filter(artwork => 'title' in artwork) as Artwork[]]);
      } else {
        setArtworks(response.artworks.filter(artwork => 'title' in artwork) as Artwork[]);
      }
      
      setNextToken(response.nextToken);
      setHasMore(!!response.nextToken);
    } catch (err) {
      console.error("Failed to load artworks:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteArtwork = useCallback(async (artworkId: string) => {
    try {
      await userApi.deleteArtwork(artworkId);
      setArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
    } catch (err) {
      console.error("Failed to delete artwork:", err);
      throw err;
    }
  }, []);

  const duplicateArtwork = useCallback(async (artworkId: string, title: string) => {
    try {
      await userApi.duplicateArtwork(artworkId, title);
      await loadArtworks(); // Reload to get the new artwork
    } catch (err) {
      console.error("Failed to duplicate artwork:", err);
      throw err;
    }
  }, [loadArtworks]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) {return;}
    await loadArtworks(nextToken);
  }, [hasMore, isLoading, nextToken, loadArtworks]);

  // 아트워크 저장 기능
  const saveArtworkMutation = useMutation({
    mutationFn: async (data: SaveArtworkData) => {
      const {
        title,
        imageDataUrl,
        uploadedImage,
        mmPerPixel,
        imageCenterXy,
        sideProcessing,
        canvasTextureImg
      } = data;

      // 1. 원본 이미지 업로드
      const imageBlob = await fetch(imageDataUrl).then(r => r.blob());
      const uploadResponse = await userApi.getOriginalImageUploadUrl(imageBlob.size);
      
      await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        body: imageBlob,
        headers: {
          'Content-Type': imageBlob.type,
        },
      });

      // 2. 썸네일 생성 및 업로드
      const crossTexture = createCrossTexture({
        uploadedImage,
        mmPerPixel,
        imageCenterXy,
        sideProcessing,
        canvasTextureImg,
      });

      const canvas = crossTexture.image as HTMLCanvasElement;
      const thumbnailDataUrl = canvas.toDataURL("image/png", 0.9);
      
      const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob());
      const thumbnailUploadResponse = await userApi.getOriginalImageUploadUrl(thumbnailBlob.size);
      
      await fetch(thumbnailUploadResponse.uploadUrl, {
        method: 'PUT',
        body: thumbnailBlob,
        headers: {
          'Content-Type': thumbnailBlob.type,
        },
      });

      // 3. 아트워크 메타데이터 저장
      return await userApi.newArtwork({
        title,
        artwork: {
          originalImageId: uploadResponse.imageId,
          imageCenterXy,
          dpi: 300,
          sideProcessing,
        },
      });
    },
    onSuccess: () => {
      // 성공 시 아트워크 목록 새로고침
      loadArtworks();
    },
    onError: (error) => {
      console.error("Error saving artwork:", error);
      setError(error as Error);
    },
  });

  return {
    artworks,
    isLoading,
    error,
    hasMore,
    loadArtworks,
    loadMore,
    deleteArtwork,
    duplicateArtwork,
    
    // 새로운 저장 기능
    saveArtwork: saveArtworkMutation.mutate,
    isSaving: saveArtworkMutation.isPending,
    saveError: saveArtworkMutation.error,
  };
}