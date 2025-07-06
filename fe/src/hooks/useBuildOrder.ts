import { useState, useCallback } from "react";
import { userApi } from "@/lib/api";
import type { Artwork } from "../../../shared/types";

type OrderItem = {
  artwork: Artwork;
  quantity: number;
};

export function useBuildOrder() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadArtworks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await userApi.queryArtworksOfUser({});
      setArtworks(response.artworks);
    } catch (error) {
      console.error("Failed to load artworks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToOrder = useCallback((artwork: Artwork) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.artwork.id === artwork.id);
      if (existingItem) {
        return prev.map(item =>
          item.artwork.id === artwork.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { artwork, quantity: 1 }];
      }
    });
  }, []);

  const removeFromOrder = useCallback((artworkId: string) => {
    setOrderItems(prev => prev.filter(item => item.artwork.id !== artworkId));
  }, []);

  const updateQuantity = useCallback((artworkId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(artworkId);
      return;
    }
    setOrderItems(prev =>
      prev.map(item =>
        item.artwork.id === artworkId ? { ...item, quantity } : item
      )
    );
  }, [removeFromOrder]);

  const getTotalPrice = useCallback(() => {
    const CANVAS_PRICE = 13000;
    return orderItems.reduce((total, item) => {
      return total + (CANVAS_PRICE * item.quantity);
    }, 0);
  }, [orderItems]);

  const getTotalItems = useCallback(() => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  }, [orderItems]);

  return {
    artworks,
    orderItems,
    isLoading,
    loadArtworks,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
  };
}