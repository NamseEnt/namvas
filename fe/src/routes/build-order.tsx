import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { userApi } from "@/lib/api";
import type { Artwork } from "../../../shared/types";
import { ArtworksSection } from "@/components/pages/build-order/ArtworksSection";
import { OrderSummarySection } from "@/components/pages/build-order/OrderSummarySection";
import { PageHeader } from "@/components/pages/build-order/PageHeader";
import { PageFooter } from "@/components/pages/build-order/PageFooter";

export const Route = createFileRoute("/build-order")({
  component: BuildOrderPage,
});

type OrderItem = {
  artwork: Artwork;
  quantity: number;
};

type BuildOrderState = {
  artworks: Artwork[];
  orderItems: OrderItem[];
  isLoading: boolean;
};

const BuildOrderContext = createContext<{
  state: BuildOrderState;
  updateState: (updates: Partial<BuildOrderState>) => void;
  addToOrder: (artwork: Artwork) => void;
  removeFromOrder: (artworkId: string) => void;
  updateQuantity: (artworkId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  loadArtworks: () => Promise<void>;
} | null>(null);

const useBuildOrderContext = () => {
  const context = useContext(BuildOrderContext);
  if (!context) {
    throw new Error('useBuildOrderContext must be used within BuildOrderContext.Provider');
  }
  return context;
};

const CANVAS_PRICE = 13000; // 캔버스 가격 13,000원
// const PLASTIC_STAND_PRICE = 250; // 플라스틱 받침대 250원

export default function BuildOrderPage() {
  const [state, setState] = useState<BuildOrderState>({
    artworks: [],
    orderItems: [],
    isLoading: true,
  });

  const updateState = (updates: Partial<BuildOrderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const loadArtworks = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      const response = await userApi.queryArtworksOfUser({});
      updateState({ artworks: response.artworks, isLoading: false });
    } catch (error) {
      console.error("Failed to load artworks:", error);
      updateState({ isLoading: false });
    }
  }, []);

  const addToOrder = (artwork: Artwork) => {
    const existingItem = state.orderItems.find(item => item.artwork.id === artwork.id);
    if (existingItem) {
      updateQuantity(artwork.id, existingItem.quantity + 1);
    } else {
      updateState({
        orderItems: [...state.orderItems, { artwork, quantity: 1 }]
      });
    }
  };

  const removeFromOrder = (artworkId: string) => {
    updateState({
      orderItems: state.orderItems.filter(item => item.artwork.id !== artworkId)
    });
  };

  const updateQuantity = (artworkId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(artworkId);
      return;
    }
    updateState({
      orderItems: state.orderItems.map(item =>
        item.artwork.id === artworkId ? { ...item, quantity } : item
      )
    });
  };

  const getTotalPrice = () => {
    return state.orderItems.reduce((total, item) => {
      return total + (CANVAS_PRICE * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return state.orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(function loadArtworksOnMount() {
    loadArtworks();
  }, [loadArtworks]);

  return (
    <BuildOrderContext.Provider
      value={{
        state,
        updateState,
        addToOrder,
        removeFromOrder,
        updateQuantity,
        getTotalPrice,
        getTotalItems,
        loadArtworks,
      }}
    >
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">주문서 만들기</h1>
            <p className="text-muted-foreground mt-2">내 작품에서 원하는 작품을 선택하여 주문서를 만들어보세요</p>
          </div>
          <OrderBuilderLayout />
        </div>
        <PageFooter />
      </div>
    </BuildOrderContext.Provider>
  );
}


function OrderBuilderLayout() {
  const { state, addToOrder, removeFromOrder, updateQuantity, getTotalPrice, getTotalItems } = useBuildOrderContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ArtworksSection 
        artworks={state.artworks}
        isLoading={state.isLoading}
        onAddToOrder={addToOrder}
      />
      <OrderSummarySection 
        orderItems={state.orderItems}
        totalPrice={getTotalPrice()}
        totalItems={getTotalItems()}
        onRemoveFromOrder={removeFromOrder}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}
