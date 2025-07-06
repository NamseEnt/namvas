import { useEffect } from "react";
import { useBuildOrder } from "@/hooks/useBuildOrder";
import { ArtworksSection } from "@/components/pages/build-order/ArtworksSection";
import { OrderSummarySection } from "@/components/pages/build-order/OrderSummarySection";
import { PageHeader } from "@/components/pages/build-order/PageHeader";
import { PageFooter } from "@/components/pages/build-order/PageFooter";
import type { Artwork } from "../../../../shared/types";

export function BuildOrderPage() {
  const {
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
          plasticStandCount={plasticStandCount}
          isPaymentLoading={isPaymentLoading}
          onAddToOrder={addToOrder}
          onRemoveFromOrder={removeFromOrder}
          onUpdateQuantity={updateQuantity}
          getTotalPrice={getTotalPrice}
          getTotalItems={getTotalItems}
          updatePlasticStandCount={updatePlasticStandCount}
          matchPlasticStandToArtworks={matchPlasticStandToArtworks}
          getPlasticStandPrice={getPlasticStandPrice}
          getFinalTotalPrice={getFinalTotalPrice}
          handlePayment={handlePayment}
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
  plasticStandCount,
  isPaymentLoading,
  onAddToOrder,
  onRemoveFromOrder,
  onUpdateQuantity,
  getTotalPrice,
  getTotalItems,
  updatePlasticStandCount,
  matchPlasticStandToArtworks,
  getPlasticStandPrice,
  getFinalTotalPrice,
  handlePayment,
}: {
  artworks: Artwork[];
  orderItems: Array<{ artwork: Artwork; quantity: number }>;
  isLoading: boolean;
  plasticStandCount: number;
  isPaymentLoading: boolean;
  onAddToOrder: (artwork: Artwork) => void;
  onRemoveFromOrder: (artworkId: string) => void;
  onUpdateQuantity: (artworkId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  updatePlasticStandCount: (count: number) => void;
  matchPlasticStandToArtworks: () => void;
  getPlasticStandPrice: () => number;
  getFinalTotalPrice: () => number;
  handlePayment: () => void;
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isPaymentLoading ? 'pointer-events-none opacity-50' : ''}`}>
      <ArtworksSection 
        artworks={artworks}
        isLoading={isLoading}
        onAddToOrder={onAddToOrder}
      />
      <OrderSummarySection 
        orderItems={orderItems}
        totalPrice={getTotalPrice()}
        totalItems={getTotalItems()}
        plasticStandCount={plasticStandCount}
        isPaymentLoading={isPaymentLoading}
        onRemoveFromOrder={onRemoveFromOrder}
        onUpdateQuantity={onUpdateQuantity}
        updatePlasticStandCount={updatePlasticStandCount}
        matchPlasticStandToArtworks={matchPlasticStandToArtworks}
        getPlasticStandPrice={getPlasticStandPrice}
        getFinalTotalPrice={getFinalTotalPrice}
        handlePayment={handlePayment}
      />
    </div>
  );
}