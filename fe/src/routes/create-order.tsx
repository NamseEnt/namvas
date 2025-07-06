import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createContext, useContext, useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { userApi } from "@/lib/api";
import type { SavedArtwork } from "../../../shared/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/create-order")({
  component: CreateOrderPage,
});

type OrderItem = {
  artwork: SavedArtwork;
  quantity: number;
};

type CreateOrderState = {
  artworks: SavedArtwork[];
  orderItems: OrderItem[];
  isLoading: boolean;
};

const CreateOrderContext = createContext<{
  state: CreateOrderState;
  updateState: (updates: Partial<CreateOrderState>) => void;
  addToOrder: (artwork: SavedArtwork) => void;
  removeFromOrder: (artworkId: string) => void;
  updateQuantity: (artworkId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  loadArtworks: () => Promise<void>;
}>(null as any);

const useCreateOrderContext = () => useContext(CreateOrderContext);

const CANVAS_PRICE = 13000; // 캔버스 가격 13,000원
const PLASTIC_STAND_PRICE = 250; // 플라스틱 받침대 250원

export default function CreateOrderPage() {
  const [state, setState] = useState<CreateOrderState>({
    artworks: [],
    orderItems: [],
    isLoading: true,
  });

  const updateState = (updates: Partial<CreateOrderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const loadArtworks = async () => {
    try {
      updateState({ isLoading: true });
      const response = await userApi.getMyArtworks();
      updateState({ artworks: response.artworks, isLoading: false });
    } catch (error) {
      console.error("Failed to load artworks:", error);
      updateState({ isLoading: false });
    }
  };

  const addToOrder = (artwork: SavedArtwork) => {
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
  }, []);

  return (
    <CreateOrderContext.Provider
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
    </CreateOrderContext.Provider>
  );
}

function PageHeader() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              NAMVAS
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="/artworks">내 작품</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/my">주문내역</a>
            </Button>
            <Button variant="outline" size="sm">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function OrderBuilderLayout() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ArtworksSection />
      <OrderSummarySection />
    </div>
  );
}

function ArtworksSection() {
  const { state, addToOrder } = useCreateOrderContext();

  if (state.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>내 작품</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">작품을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (state.artworks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>내 작품</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">저장된 작품이 없습니다</p>
          <Button className="mt-4" asChild>
            <a href="/studio">첫 작품 만들기</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>내 작품</span>
          <Badge variant="secondary">{state.artworks.length}개</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
          {state.artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ArtworkCard({ artwork }: { artwork: SavedArtwork }) {
  const { addToOrder } = useCreateOrderContext();

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={`https://your-s3-bucket.s3.amazonaws.com/${artwork.thumbnailS3Key}`}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm truncate mb-2">{artwork.title}</h3>
        <Button 
          size="sm" 
          className="w-full"
          onClick={() => addToOrder(artwork)}
        >
          <Plus className="w-4 h-4 mr-1" />
          주문에 추가
        </Button>
      </CardContent>
    </Card>
  );
}

function OrderSummarySection() {
  const { state, removeFromOrder, updateQuantity, getTotalPrice, getTotalItems } = useCreateOrderContext();

  return (
    <Card className="h-fit sticky top-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          나의 주문서
          {getTotalItems() > 0 && (
            <Badge variant="default">{getTotalItems()}개</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.orderItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">주문할 작품을 선택해주세요</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {state.orderItems.map((item) => (
                <OrderItemCard key={item.artwork.id} item={item} />
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>캔버스 ({getTotalItems()}개)</span>
                  <span>{(CANVAS_PRICE * getTotalItems()).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>총 결제금액</span>
                  <span>{getTotalPrice().toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" asChild>
              <a href="/payment">결제하기</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderItemCard({ item }: { item: OrderItem }) {
  const { removeFromOrder, updateQuantity } = useCreateOrderContext();

  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
        <img
          src={`https://your-s3-bucket.s3.amazonaws.com/${item.artwork.thumbnailS3Key}`}
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
              onClick={() => updateQuantity(item.artwork.id, item.quantity - 1)}
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
              onClick={() => updateQuantity(item.artwork.id, item.quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium">
              {(CANVAS_PRICE * item.quantity).toLocaleString()}원
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFromOrder(item.artwork.id)}
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

function PageFooter() {
  return (
    <footer className="border-t bg-card mt-16">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center gap-8">
          <a
            href="https://x.com/messages/compose?recipient_id=NAMVAS_X_ID"
            className="text-muted-foreground hover:text-sky-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <X className="w-5 h-5" />
          </a>
          <div className="flex gap-6 text-sm">
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              서비스 이용약관
            </a>
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}