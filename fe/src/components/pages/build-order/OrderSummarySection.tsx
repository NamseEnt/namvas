import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, X, Plus, Minus, Loader2 } from "lucide-react";
import { PRICES } from "@/constants";
import type { Artwork } from "../../../../../shared/types";

type OrderItem = {
  artwork: Artwork;
  quantity: number;
};

type OrderSummarySectionProps = {
  orderItems: OrderItem[];
  totalPrice: number;
  totalItems: number;
  plasticStandCount: number;
  isPaymentLoading: boolean;
  onRemoveFromOrder: (artworkId: string) => void;
  onUpdateQuantity: (artworkId: string, quantity: number) => void;
  updatePlasticStandCount: (count: number) => void;
  matchPlasticStandToArtworks: () => void;
  getPlasticStandPrice: () => number;
  getFinalTotalPrice: () => number;
  handlePayment: () => void;
};

// 가격 상수는 @/constants에서 import하여 사용

export function OrderSummarySection({ 
  orderItems, 
  totalItems, 
  plasticStandCount,
  isPaymentLoading,
  onRemoveFromOrder, 
  onUpdateQuantity,
  updatePlasticStandCount,
  matchPlasticStandToArtworks,
  getPlasticStandPrice,
  getFinalTotalPrice,
  handlePayment
}: OrderSummarySectionProps) {
  return (
    <Card className="h-fit sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          나의 주문서
          {totalItems > 0 && (
            <Badge variant="default">{totalItems}개</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orderItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">주문할 작품을 선택해주세요</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {orderItems.map((item) => (
                <OrderItemCard 
                  key={item.artwork.id} 
                  item={item} 
                  onRemoveFromOrder={onRemoveFromOrder}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </div>
            
            <PlasticStandSection 
              plasticStandCount={plasticStandCount}
              totalItems={totalItems}
              updatePlasticStandCount={updatePlasticStandCount}
              matchPlasticStandToArtworks={matchPlasticStandToArtworks}
              getPlasticStandPrice={getPlasticStandPrice}
            />
            
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>캔버스 ({totalItems}개)</span>
                  <span>{(PRICES.CANVAS * totalItems).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>플라스틱 스탠드 ({plasticStandCount}개)</span>
                  <span>{getPlasticStandPrice().toLocaleString()}원</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>총 결제금액</span>
                  <span>{getFinalTotalPrice().toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handlePayment}
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '배송지 입력하고 결제하기'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderItemCard({ 
  item, 
  onRemoveFromOrder, 
  onUpdateQuantity 
}: { 
  item: OrderItem; 
  onRemoveFromOrder: (artworkId: string) => void;
  onUpdateQuantity: (artworkId: string, quantity: number) => void;
}) {
  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
        <img
          src={`https://your-s3-bucket.s3.amazonaws.com/${item.artwork.thumbnailId}`}
          alt={item.artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium text-sm truncate">{item.artwork.title}</h4>
        <p className="text-xs text-muted-foreground">10x15cm 캔버스</p>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(item.artwork.id, item.quantity - 1)}
              className="h-8 w-8 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm font-medium min-w-[20px] text-center">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(item.artwork.id, item.quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium">
              {(PRICES.CANVAS * item.quantity).toLocaleString()}원
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFromOrder(item.artwork.id)}
              className="text-red-600 hover:text-red-700 h-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlasticStandSection({
  plasticStandCount,
  totalItems,
  updatePlasticStandCount,
  matchPlasticStandToArtworks,
  getPlasticStandPrice
}: {
  plasticStandCount: number;
  totalItems: number;
  updatePlasticStandCount: (count: number) => void;
  matchPlasticStandToArtworks: () => void;
  getPlasticStandPrice: () => number;
}) {
  return (
    <div className="border-t pt-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">플라스틱 스탠드</span>
          <Badge variant="secondary">옵션</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePlasticStandCount(plasticStandCount - 1)}
            className="h-8 w-8 p-0"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            value={plasticStandCount}
            onChange={(e) => updatePlasticStandCount(parseInt(e.target.value) || 0)}
            className="w-16 h-8 text-center"
            min="0"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePlasticStandCount(plasticStandCount + 1)}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={matchPlasticStandToArtworks}
          className="w-full"
        >
          작품 개수와 맞추기 ({totalItems}개)
        </Button>
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>단가: {PRICES.PLASTIC_STAND.toLocaleString()}원</span>
          <span>소계: {getPlasticStandPrice().toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}