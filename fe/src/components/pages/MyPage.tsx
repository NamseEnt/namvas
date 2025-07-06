import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createContext, useContext, useState } from "react";
import { X } from "lucide-react";

type OrderStatus = "payment_completed" | "in_production" | "shipping" | "delivered";

type Order = {
  id: string;
  orderDate: string;
  orderNumber: string;
  thumbnailUrl: string;
  finalAmount: number;
  status: OrderStatus;
  quantity: number;
  hasPlasticStand: boolean;
};

type MyPageState = {
  orders: Order[];
};

const MyPageContext = createContext<{
  state: MyPageState;
  updateState: (updates: Partial<MyPageState>) => void;
  handleCancelOrder: (orderId: string) => void;
}>(null as any);

const useMyPageContext = () => useContext(MyPageContext);

export function MyPage() {
  const [state, setState] = useState<MyPageState>({
    orders: [
      {
        id: "1",
        orderDate: "2024-06-28",
        orderNumber: "ORDER-12345678",
        thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop",
        finalAmount: 13250,
        status: "payment_completed",
        quantity: 1,
        hasPlasticStand: true,
      },
      {
        id: "2",
        orderDate: "2024-06-25",
        orderNumber: "ORDER-12345677",
        thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=150&fit=crop",
        finalAmount: 23000,
        status: "in_production",
        quantity: 2,
        hasPlasticStand: false,
      },
      {
        id: "3",
        orderDate: "2024-06-20",
        orderNumber: "ORDER-12345676",
        thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=150&fit=crop",
        finalAmount: 13000,
        status: "shipping",
        quantity: 1,
        hasPlasticStand: false,
      },
      {
        id: "4",
        orderDate: "2024-06-15",
        orderNumber: "ORDER-12345675",
        thumbnailUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&h=150&fit=crop",
        finalAmount: 26500,
        status: "delivered",
        quantity: 2,
        hasPlasticStand: true,
      },
    ],
  });

  const updateState = (updates: Partial<MyPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleCancelOrder = (orderId: string) => {
    const updatedOrders = state.orders.filter(order => order.id !== orderId);
    updateState({ orders: updatedOrders });
  };

  return (
    <MyPageContext.Provider
      value={{
        state,
        updateState,
        handleCancelOrder,
      }}
    >
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">마이페이지</h1>
            <p className="text-muted-foreground mt-2">주문내역을 확인하고 관리하세요</p>
          </div>
          <OrderHistorySection />
        </div>
        <PageFooter />
      </div>
    </MyPageContext.Provider>
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
            <Button variant="outline" size="sm">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function OrderHistorySection() {
  const { state } = useMyPageContext();

  if (state.orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <p className="text-muted-foreground text-lg">아직 주문내역이 없습니다</p>
          <Button className="mt-4" onClick={() => window.location.href = "/"}>
            첫 주문하러 가기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">주문내역</h2>
        <span className="text-sm text-muted-foreground">
          총 {state.orders.length}건의 주문
        </span>
      </div>
      
      <div className="space-y-4">
        {state.orders.map((order) => (
          <OrderItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function OrderItem({ order }: { order: Order }) {
  const { handleCancelOrder } = useMyPageContext();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex gap-4 flex-1">
            <div className="w-24 h-18 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={order.thumbnailUrl}
                alt="상품 썸네일"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                <div>
                  <h3 className="font-semibold">10x15cm 커스텀 캔버스</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.quantity}개
                    {order.hasPlasticStand && " (플라스틱 받침대 포함)"}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">주문일자</span>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">주문번호</span>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">결제금액</span>
                  <p className="font-medium text-lg">{order.finalAmount.toLocaleString()}원</p>
                </div>
                <div className="flex justify-end">
                  {order.status === "payment_completed" && (
                    <CancelOrderButton 
                      orderId={order.id} 
                      orderNumber={order.orderNumber}
                      onCancel={handleCancelOrder}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig = {
    payment_completed: { label: "결제완료", variant: "default" as const },
    in_production: { label: "제작중", variant: "secondary" as const },
    shipping: { label: "배송중", variant: "outline" as const },
    delivered: { label: "배송완료", variant: "destructive" as const },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}

function CancelOrderButton({ 
  orderId, 
  orderNumber, 
  onCancel 
}: { 
  orderId: string; 
  orderNumber: string; 
  onCancel: (orderId: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
          주문 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>주문을 취소하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>주문번호: {orderNumber}</p>
            <p>주문을 취소하면 결제가 환불되며, 이 작업은 되돌릴 수 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              환불은 영업일 기준 3-5일 내에 완료됩니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onCancel(orderId)}
            className="bg-red-600 hover:bg-red-700"
          >
            주문 취소하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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