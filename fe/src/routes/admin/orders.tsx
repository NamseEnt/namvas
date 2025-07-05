import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import type { Order, OrderStatus } from "../../../../shared/types";

function isValidOrderStatus(status: string | undefined): status is OrderStatus | undefined {
  if (status === undefined) {return true;}
  return ['payment_completed', 'in_production', 'shipping', 'delivered', 'production_hold'].includes(status);
}

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
  validateSearch: (search: Record<string, unknown>) => {
    const statusParam = search.status as string | undefined;
    return {
      status: isValidOrderStatus(statusParam) ? statusParam : undefined,
      search: search.search as string | undefined,
      page: search.page ? Number(search.page) : 1,
    };
  },
});


export default function AdminOrders() {
  const navigate = useNavigate();
  const { status, search, page } = Route.useSearch();
  const [searchInput, setSearchInput] = useState(search || "");

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { status, search, page }],
    queryFn: () => adminApi.getOrders({ 
      status, 
      search, 
      page, 
      limit: 20 
    }),
  });

  const handleStatusFilter = (newStatus: string | undefined) => {
    const validatedStatus: OrderStatus | undefined = isValidOrderStatus(newStatus) ? newStatus as OrderStatus : undefined;
    navigate({
      to: "/admin/orders",
      search: { status: validatedStatus, search, page: 1 },
    });
  };

  const handleSearch = () => {
    navigate({
      to: "/admin/orders",
      search: { status, search: searchInput, page: 1 },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      to: "/admin/orders",
      search: { status, search, page: newPage },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <div className="flex space-x-2">
          <Input
            placeholder="주문번호 또는 고객명 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-64"
          />
          <Button onClick={handleSearch}>검색</Button>
        </div>
      </div>

      <StatusFilters
        currentStatus={status}
        onStatusChange={handleStatusFilter}
      />

      {data && (
        <>
          <OrdersTable orders={data.orders} />
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

function StatusFilters({
  currentStatus,
  onStatusChange,
}: {
  currentStatus?: string;
  onStatusChange: (status: string | undefined) => void;
}) {
  const filters = [
    { value: undefined, label: "전체", count: undefined },
    { value: "payment_completed", label: "결제완료", count: undefined },
    { value: "in_production", label: "제작중", count: undefined },
    { value: "shipping", label: "배송중", count: undefined },
    { value: "delivered", label: "배송완료", count: undefined },
    { value: "production_hold", label: "제작보류", count: undefined },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value || "all"}
          variant={currentStatus === filter.value ? "default" : "outline"}
          onClick={() => onStatusChange(filter.value)}
          className="whitespace-nowrap"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          검색 조건에 맞는 주문이 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>주문 목록 ({orders.length}건)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">주문번호</th>
                <th className="text-left py-3 px-2">고객</th>
                <th className="text-left py-3 px-2">주문일</th>
                <th className="text-left py-3 px-2">금액</th>
                <th className="text-left py-3 px-2">상태</th>
                <th className="text-left py-3 px-2">관리</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <p className="font-medium">주문 #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity}개 {order.plasticStand && "(스탠드 포함)"}
                      </p>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{order.recipient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.recipient.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2">{formatDate(order.orderDate)}</td>
                    <td className="py-3 px-2">
                      가격 정보 없음
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant={badge.variant}>{badge.text}</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        to="/admin/orders/$orderId"
                        params={{ orderId: order.id }}
                      >
                        <Button size="sm">상세</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex justify-center space-x-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </Button>

      {getPageNumbers().map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          onClick={() => onPageChange(pageNum)}
        >
          {pageNum}
        </Button>
      ))}

      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </Button>
    </div>
  );
}
