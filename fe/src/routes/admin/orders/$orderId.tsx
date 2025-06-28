import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderDetail,
});

type OrderStatus = "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";

type OrderDetail = {
  id: string;
  orderNumber: string;
  orderDate: string;
  finalAmount: number;
  status: OrderStatus;
  quantity: number;
  hasPlasticStand: boolean;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  recipient: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
  };
  deliveryMemo?: string;
  artworkDefinition: {
    originalImageDataUrl: string;
    mmPerPixel: number;
    imageCenterXy: { x: number; y: number };
    sideProcessing: {
      type: "clip" | "color" | "flip" | "none";
      color?: string;
    };
    canvasBackgroundColor: string;
  };
  textureUrl: string;
  printImageUrl: string;
  trackingNumber?: string;
  adminMemo?: string;
};

export default function AdminOrderDetail() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "" as OrderStatus,
    trackingNumber: "",
    adminMemo: "",
  });

  useEffect(function loadOrderDetail() {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/adminGetOrderDetail?orderId=${orderId}`);
        const result = await response.json();
        
        if (result.ok) {
          setOrder(result.order);
          setUpdateData({
            status: result.order.status,
            trackingNumber: result.order.trackingNumber || "",
            adminMemo: result.order.adminMemo || "",
          });
        } else {
          navigate({ to: "/admin/orders" });
        }
      } catch (error) {
        console.error("Failed to load order:", error);
        navigate({ to: "/admin/orders" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleUpdateOrder = async () => {
    if (!order) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/adminUpdateOrderStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          ...updateData,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        setOrder((prev) => prev ? { ...prev, ...updateData } : null);
        alert("주문 정보가 업데이트되었습니다.");
      } else {
        alert("업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPrintImage = () => {
    if (order?.printImageUrl) {
      const link = document.createElement("a");
      link.href = order.printImageUrl;
      link.download = `${order.orderNumber}_print.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">주문 상세</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">주문 상세</h1>
        <div className="text-center py-8">주문을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">주문 상세 - {order.orderNumber}</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/orders" })}>
          목록으로
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderInfoCard order={order} />
        <OrderManagementCard
          order={order}
          updateData={updateData}
          setUpdateData={setUpdateData}
          onUpdate={handleUpdateOrder}
          isSaving={isSaving}
          onDownloadPrint={downloadPrintImage}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerInfoCard order={order} />
        <ArtworkInfoCard order={order} />
      </div>
    </div>
  );
}

function OrderInfoCard({ order }: { order: OrderDetail }) {
  const getStatusBadge = (status: OrderStatus) => {
    const badges = {
      payment_completed: { text: "결제완료", variant: "default" as const },
      in_production: { text: "제작중", variant: "secondary" as const },
      shipping: { text: "배송중", variant: "default" as const },
      delivered: { text: "배송완료", variant: "outline" as const },
      production_hold: { text: "제작보류", variant: "destructive" as const },
    };
    return badges[status];
  };

  const badge = getStatusBadge(order.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>주문 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>주문번호</Label>
            <p className="font-medium">{order.orderNumber}</p>
          </div>
          <div>
            <Label>주문일시</Label>
            <p>{new Date(order.orderDate).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <Label>주문 상태</Label>
            <div>
              <Badge variant={badge.variant}>{badge.text}</Badge>
            </div>
          </div>
          <div>
            <Label>주문 금액</Label>
            <p className="font-medium">{order.finalAmount.toLocaleString()}원</p>
          </div>
          <div>
            <Label>수량</Label>
            <p>{order.quantity}개</p>
          </div>
          <div>
            <Label>플라스틱 스탠드</Label>
            <p>{order.hasPlasticStand ? "포함" : "미포함"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderManagementCard({
  order,
  updateData,
  setUpdateData,
  onUpdate,
  isSaving,
  onDownloadPrint,
}: {
  order: OrderDetail;
  updateData: { status: OrderStatus; trackingNumber: string; adminMemo: string };
  setUpdateData: (data: { status: OrderStatus; trackingNumber: string; adminMemo: string }) => void;
  onUpdate: () => void;
  isSaving: boolean;
  onDownloadPrint: () => void;
}) {
  const statusOptions = [
    { value: "payment_completed", label: "결제완료" },
    { value: "in_production", label: "제작중" },
    { value: "shipping", label: "배송중" },
    { value: "delivered", label: "배송완료" },
    { value: "production_hold", label: "제작보류" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>주문 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>주문 상태</Label>
          <select
            value={updateData.status}
            onChange={(e) => setUpdateData({ ...updateData, status: e.target.value as OrderStatus })}
            className="w-full p-2 border rounded"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>운송장 번호</Label>
          <Input
            value={updateData.trackingNumber}
            onChange={(e) => setUpdateData({ ...updateData, trackingNumber: e.target.value })}
            placeholder="운송장 번호를 입력하세요"
          />
        </div>

        <div>
          <Label>관리자 메모</Label>
          <Textarea
            value={updateData.adminMemo}
            onChange={(e) => setUpdateData({ ...updateData, adminMemo: e.target.value })}
            placeholder="내부 관리용 메모"
            rows={3}
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={onUpdate} disabled={isSaving} className="flex-1">
            {isSaving ? "저장 중..." : "업데이트"}
          </Button>
          <Button variant="outline" onClick={onDownloadPrint}>
            인쇄용 이미지 다운로드
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerInfoCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>고객 및 배송 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>주문자</Label>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm text-muted-foreground">{order.customer.email}</p>
          <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
        </div>

        <div>
          <Label>배송지</Label>
          <p className="font-medium">{order.recipient.name}</p>
          <p className="text-sm">{order.recipient.phone}</p>
          <p className="text-sm">
            ({order.recipient.postalCode}) {order.recipient.address}
          </p>
          <p className="text-sm">{order.recipient.addressDetail}</p>
        </div>

        {order.deliveryMemo && (
          <div>
            <Label>배송 요청사항</Label>
            <p className="text-sm">{order.deliveryMemo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArtworkInfoCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>작품 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>작품 이미지</Label>
          <img
            src={order.artworkDefinition.originalImageDataUrl}
            alt="작품"
            className="w-full max-w-sm border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label>해상도</Label>
            <p>{order.artworkDefinition.mmPerPixel} mm/pixel</p>
          </div>
          <div>
            <Label>배경색</Label>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 border rounded"
                style={{ backgroundColor: order.artworkDefinition.canvasBackgroundColor }}
              />
              <span>{order.artworkDefinition.canvasBackgroundColor}</span>
            </div>
          </div>
          <div>
            <Label>가장자리 처리</Label>
            <p>{order.artworkDefinition.sideProcessing.type}</p>
          </div>
          <div>
            <Label>중앙 좌표</Label>
            <p>
              ({Math.round(order.artworkDefinition.imageCenterXy.x)}, {Math.round(order.artworkDefinition.imageCenterXy.y)})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}