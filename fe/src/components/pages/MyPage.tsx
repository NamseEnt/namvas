import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Package } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import type { Order } from "../../../../shared/types";

type MyPageState = {
  orders: Order[];
};

const MyPageContext = createContext<{
  state: MyPageState;
  updateState: (updates: Partial<MyPageState>) => void;
  handleCancelOrder: (orderId: string) => void;
  navigate: (options: { to: string }) => void;
}>(null!);

const useMyPageContext = () => useContext(MyPageContext);

export function MyPage() {
  const { orders, isLoading, error, loadOrders, cancelOrder } = useOrders();
  const navigate = useNavigate();
  const [state, setState] = useState<MyPageState>({
    orders: [],
  });

  useEffect(
    function loadInitialOrders() {
      loadOrders();
    },
    [loadOrders]
  );

  useEffect(
    function updateLocalState() {
      setState({ orders });
    },
    [orders]
  );

  const updateState = (updates: Partial<MyPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      setState((prev) => ({
        orders: prev.orders.map((order) =>
          order.id === orderId
            ? { ...order, status: "payment_canceled" as const }
            : order
        ),
      }));
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("주문 취소 중 오류가 발생했습니다.");
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>주문내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">
            주문내역을 불러오는 중 오류가 발생했습니다.
          </p>
          <Button onClick={() => loadOrders()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MyPageContext.Provider value={{ state, updateState, handleCancelOrder, navigate }}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Header />
        <OrderHistorySection />
      </div>
    </MyPageContext.Provider>
  );
}

function Header() {
  return (
    <header className="text-center space-y-2">
      <h1 className="text-3xl font-bold">마이페이지</h1>
      <p className="text-muted-foreground">주문내역과 계정 정보를 확인하세요</p>
    </header>
  );
}

function OrderHistorySection() {
  const { state, navigate } = useMyPageContext();

  if (state.orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            아직 주문내역이 없습니다
          </p>
          <Button className="mt-4" onClick={() => navigate({ to: "/" })}>
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

  const artworkItems = order.rows.filter((row) => row.item.type === "artwork");
  const plasticStandItems = order.rows.filter(
    (row) => row.item.type === "plasticStand"
  );
  const mainItem = artworkItems[0];

  const getTotalPrice = () => {
    return order.rows.reduce((total, row) => total + row.price * row.count, 0);
  };

  const getTotalQuantity = () => {
    return artworkItems.reduce((total, row) => total + row.count, 0);
  };

  const getPlasticStandCount = () => {
    return plasticStandItems.reduce((total, row) => total + row.count, 0);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex gap-4 flex-1">
            <div className="w-24 h-18 bg-muted rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-2">
                <div>
                  <h3 className="font-semibold">
                    {mainItem?.item.type === "artwork"
                      ? mainItem.item.title
                      : "10x15cm 커스텀 캔버스"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getTotalQuantity()}개
                    {getPlasticStandCount() > 0 &&
                      ` (플라스틱 받침대 ${getPlasticStandCount()}개 포함)`}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">주문번호</span>
                  <p className="font-medium">{order.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">수령인</span>
                  <p className="font-medium">{order.recipient.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">결제금액</span>
                  <p className="font-medium text-lg">
                    {getTotalPrice().toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                {(order.status === "payment_verifing" ||
                  order.status === "waiting_start_production") && (
                  <CancelOrderButton
                    orderId={order.id}
                    orderNumber={order.id}
                    onCancel={handleCancelOrder}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const statusConfig: Record<
    Order["status"],
    {
      label: string;
      variant: "secondary" | "default" | "destructive" | "outline";
    }
  > = {
    payment_verifing: { label: "결제 확인중", variant: "secondary" },
    payment_failed: { label: "결제실패", variant: "destructive" },
    waiting_start_production: { label: "제작 대기중", variant: "default" },
    in_production: { label: "제작중", variant: "default" },
    shipping: { label: "배송중", variant: "outline" },
    delivered: { label: "배송완료", variant: "outline" },
    payment_cancelling: { label: "결제 취소중", variant: "secondary" },
    payment_canceled: { label: "결제 취소됨", variant: "destructive" },
    payment_cancel_rejected: { label: "취소 거부됨", variant: "destructive" },
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function CancelOrderButton({
  orderId,
  orderNumber,
  onCancel,
}: {
  orderId: string;
  orderNumber: string;
  onCancel: (orderId: string) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          주문취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>주문을 취소하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            주문번호: {orderNumber}
            <br />
            <br />
            주문을 취소하면 결제가 취소되며, 이 작업은 되돌릴 수 없습니다.
            정말로 취소하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>아니오</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onCancel(orderId)}
          >
            네, 취소합니다
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
