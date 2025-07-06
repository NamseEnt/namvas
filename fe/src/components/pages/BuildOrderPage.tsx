import { useEffect } from "react";
import { useBuildOrder } from "@/hooks/useBuildOrder";
import { ArtworksSection } from "@/components/pages/build-order/ArtworksSection";
import { OrderSummarySection } from "@/components/pages/build-order/OrderSummarySection";
import { PageHeader } from "@/components/pages/build-order/PageHeader";
import { PageFooter } from "@/components/pages/build-order/PageFooter";

export function BuildOrderPage() {
  const {
    artworks,
    orderItems,
    isLoading,
    loadArtworks,
    addToOrder,
    removeFromOrder,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
  } = useBuildOrder();

  useEffect(function loadArtworksOnMount() {
    loadArtworks();
  }, [loadArtworks]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">주문서 만들기</h1>
          <p className="text-muted-foreground mt-2">내 작품에서 원하는 작품을 선택하여 주문서를 만들어보세요</p>
        </div>
        <OrderBuilderLayout 
          artworks={artworks}
          orderItems={orderItems}
          isLoading={isLoading}
          onAddToOrder={addToOrder}
          onRemoveFromOrder={removeFromOrder}
          onUpdateQuantity={updateQuantity}
          getTotalPrice={getTotalPrice}
          getTotalItems={getTotalItems}
        />
      </div>
      <PageFooter />
    </div>
  );
}

function OrderBuilderLayout({
  artworks,
  orderItems,
  isLoading,
  onAddToOrder,
  onRemoveFromOrder,
  onUpdateQuantity,
  getTotalPrice,
  getTotalItems,
}: {
  artworks: any[];
  orderItems: any[];
  isLoading: boolean;
  onAddToOrder: (artwork: any) => void;
  onRemoveFromOrder: (artworkId: string) => void;
  onUpdateQuantity: (artworkId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ArtworksSection 
        artworks={artworks}
        isLoading={isLoading}
        onAddToOrder={onAddToOrder}
      />
      <OrderSummarySection 
        orderItems={orderItems}
        totalPrice={getTotalPrice()}
        totalItems={getTotalItems()}
        onRemoveFromOrder={onRemoveFromOrder}
        onUpdateQuantity={onUpdateQuantity}
      />
    </div>
  );
}