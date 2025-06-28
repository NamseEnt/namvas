import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const completeSearchSchema = {
  orderId: {
    optional: true,
  } as const,
  amount: {
    optional: true,
  } as const,
};

export const Route = createFileRoute("/order-complete")({
  validateSearch: completeSearchSchema,
  component: OrderCompletePage,
});

export default function OrderCompletePage() {
  const navigate = useNavigate();
  const { orderId, amount } = Route.useSearch();
  
  const displayOrderId = orderId || "ORDER-" + Date.now().toString().slice(-8);
  const displayAmount = amount ? parseInt(amount).toLocaleString() : "13,000";

  const handleViewOrders = () => {
    navigate({ to: "/my" });
  };

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              결제 및 주문이 완료되었습니다!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">결제금액</p>
                <p className="text-xl font-bold">{displayAmount}원</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">주문번호</p>
                <p className="text-lg font-semibold">{displayOrderId}</p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 네이버페이로 안전하게 결제되었습니다.</p>
              <p>• 주문 확인 및 제작 시작까지 1-2일 소요됩니다.</p>
              <p>• 제작 완료 후 배송까지 3-5일 소요됩니다.</p>
              <p>• 주문 상태는 마이페이지에서 확인하실 수 있습니다.</p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleViewOrders} 
                className="w-full"
                size="lg"
              >
                내 주문내역 보기
              </Button>
              <Button 
                onClick={handleGoHome} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                홈으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}