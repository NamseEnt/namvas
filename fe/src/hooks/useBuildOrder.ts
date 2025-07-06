import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { userApi } from "@/lib/api";
import type { Artwork } from "../../../shared/types";

type OrderItem = {
  artwork: Artwork;
  quantity: number;
};

export function useBuildOrder() {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plasticStandCount, setPlasticStandCount] = useState(0);
  const [isPaymentLoading] = useState(false);

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
    const CANVAS_PRICE = 10000;
    return orderItems.reduce((total, item) => {
      return total + (CANVAS_PRICE * item.quantity);
    }, 0);
  }, [orderItems]);

  const getTotalItems = useCallback(() => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  }, [orderItems]);

  const updatePlasticStandCount = useCallback((count: number) => {
    setPlasticStandCount(Math.max(0, count));
  }, []);

  const matchPlasticStandToArtworks = useCallback(() => {
    const totalArtworks = getTotalItems();
    setPlasticStandCount(totalArtworks);
  }, [getTotalItems]);

  const getPlasticStandPrice = useCallback(() => {
    const PLASTIC_STAND_PRICE = 250;
    return plasticStandCount * PLASTIC_STAND_PRICE;
  }, [plasticStandCount]);

  const getFinalTotalPrice = useCallback(() => {
    return getTotalPrice() + getPlasticStandPrice();
  }, [getTotalPrice, getPlasticStandPrice]);

  
  const handlePayment = useCallback(() => {
    if (orderItems.length === 0) {
      alert('주문할 상품을 선택해주세요.');
      return;
    }
    
    // 주문 데이터를 localStorage에 저장
    const orderData = {
      orderItems: orderItems.map(item => ({
        artworkId: item.artwork.id,
        quantity: item.quantity,
        price: 10000,
      })),
      plasticStandCount,
      plasticStandPrice: 250,
      totalPrice: getFinalTotalPrice(),
    };
    
    localStorage.setItem('tempOrderData', JSON.stringify(orderData));
    
    // 배송지 입력 페이지로 이동
    navigate({ to: '/order', search: { fromStudio: undefined, fromBuildOrder: 'true' } });
    
  }, [orderItems, plasticStandCount, getFinalTotalPrice, navigate]);

  return {
    artworks,
    orderItems,
    isLoading,
    plasticStandCount,
    isPaymentLoading,
    loadArtworks,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    updatePlasticStandCount,
    matchPlasticStandToArtworks,
    getPlasticStandPrice,
    getFinalTotalPrice,
    handlePayment,
  };
}