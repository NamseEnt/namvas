import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import type { Order, OrderStatus } from "../../../../../shared/types";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderDetail,
  validateSearch: (search: any) => search,
});


export default function AdminOrderDetail() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [updateData, setUpdateData] = useState({
    status: "payment_completed" as OrderStatus,
    trackingNumber: "",
    adminMemo: "",
  });

  const { data: orderResponse, isLoading, error } = useQuery({
    queryKey: ['orderDetail', orderId],
    queryFn: () => adminApi.getOrder(orderId),
  });

  const order = orderResponse?.order;

  // Set update data when order is loaded
  if (order && updateData.status === "payment_completed" && order.status !== "payment_completed") {
    setUpdateData({
      status: order.status,
      trackingNumber: "",
      adminMemo: "",
    });
  }

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateOrderStatus(
      orderId,
      updateData.status,
      updateData.adminMemo
    ),
    onSuccess: () => {
      alert("주문 정보가 업데이트되었습니다.");
    },
    onError: () => {
      alert("업데이트에 실패했습니다.");
    },
  });

  if (error) {
    navigate({ to: "/admin/orders", search: { status: undefined, search: undefined, page: 1 } });
    return null;
  }


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
        <h1 className="text-2xl font-bold">주문 상세 - #{order.id}</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/orders", search: { status: undefined, search: undefined, page: 1 } })}>
          목록으로
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderInfoCard order={order} />
        <OrderManagementCard
          order={order}
          updateData={updateData}
          setUpdateData={setUpdateData}
          onUpdate={() => updateMutation.mutate()}
          isSaving={updateMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerInfoCard order={order} />
        <ArtworkInfoCard order={order} />
      </div>
    </div>
  );
}

function OrderInfoCard({ order }: { order: Order }) {
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
            <p className="font-medium">#{order.id}</p>
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
            <p className="font-medium">가격 정보 없음</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderManagementCard({
  order: _order,
  updateData,
  setUpdateData,
  onUpdate,
  isSaving,
}: {
  order: Order;
  updateData: { status: OrderStatus; trackingNumber: string; adminMemo: string };
  setUpdateData: (data: { status: OrderStatus; trackingNumber: string; adminMemo: string }) => void;
  onUpdate: () => void;
  isSaving: boolean;
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
          <Button onClick={onUpdate} disabled={isSaving} className="w-full">
            {isSaving ? "저장 중..." : "업데이트"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerInfoCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>고객 및 배송 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>주문자</Label>
          <p className="font-medium">사용자 정보 없음</p>
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
      </CardContent>
    </Card>
  );
}

function ArtworkInfoCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>주문 상품 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>주문 상품</Label>
          <p className="font-medium">캔버스</p>
          <p className="text-sm text-muted-foreground">
            수량: {order.quantity}개
            {order.plasticStand && " • 플라스틱 스탠드 포함"}
          </p>
        </div>

        <div>
          <Label>작품 정보</Label>
          <p>S3 Key: {order.artwork.originalImageS3Key}</p>
          <p>해상도: {order.artwork.mmPerPixel} mm/pixel</p>
          <p>중앙 좌표: ({order.artwork.imageCenterXy.x}, {order.artwork.imageCenterXy.y})</p>
          <p>가장자리 처리: {order.artwork.sideProcessing.type}</p>
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