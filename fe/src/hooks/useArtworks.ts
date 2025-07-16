import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Artwork } from "../../../shared/types";

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
      const response = await api.listMyArtworks({
        pageSize: 20,
        nextToken: pageToken,
      });

      if (!response.ok) {
        throw new Error(response.reason);
      }

      if (pageToken) {
        setArtworks((prev) => [
          ...prev,
          ...(response.artworks.filter(
            (artwork) => "title" in artwork
          ) as Artwork[]),
        ]);
      } else {
        setArtworks(
          response.artworks.filter((artwork) => "title" in artwork) as Artwork[]
        );
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
      const response = await api.deleteArtwork({ artworkId });
      if (!response.ok) {
        throw new Error(response.reason);
      }
      setArtworks((prev) => prev.filter((artwork) => artwork.id !== artworkId));
    } catch (err) {
      console.error("Failed to delete artwork:", err);
      throw err;
    }
  }, []);

  const duplicateArtwork = useCallback(
    async (artworkId: string, title: string) => {
      try {
        const response = await api.duplicateArtwork({ artworkId, title });
        if (!response.ok) {
          throw new Error(response.reason);
        }
        await loadArtworks(); // Reload to get the new artwork
      } catch (err) {
        console.error("Failed to duplicate artwork:", err);
        throw err;
      }
    },
    [loadArtworks]
  );

  const updateArtworkTitle = useCallback(
    async (artworkId: string, title: string) => {
      try {
        const artwork = artworks.find((artwork) => artwork.id === artworkId);
        if (!artwork) {
          throw new Error("Artwork not found");
        }

        const response = await api.updateArtwork({
          artworkId,
          title,
          sideMode: artwork.sideMode,
          imageOffset: artwork.imageOffset,
        });

        if (!response.ok) {
          throw new Error(response.reason);
        }

        setArtworks((prev) =>
          prev.map((artwork) =>
            artwork.id === artworkId ? { ...artwork, title } : artwork
          )
        );
      } catch (err) {
        console.error("Failed to update artwork title:", err);
        throw err;
      }
    },
    [artworks]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) {
      return;
    }
    await loadArtworks(nextToken);
  }, [hasMore, isLoading, nextToken, loadArtworks]);

  return {
    artworks,
    isLoading,
    error,
    hasMore,
    loadArtworks,
    loadMore,
    deleteArtwork,
    duplicateArtwork,
    updateArtworkTitle,
  };
}