import { useState, useCallback } from "react";
import { userApi } from "@/lib/api";
import type { Artwork } from "../../../shared/types";

export function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const loadArtworks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await userApi.queryArtworksOfUser({});
      setArtworks(response.artworks);
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

  return {
    artworks,
    isLoading,
    error,
    loadArtworks,
    deleteArtwork,
    duplicateArtwork,
  };
}