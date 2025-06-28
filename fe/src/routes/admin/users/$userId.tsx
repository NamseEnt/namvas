import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users/$userId")({
  component: AdminUserDetail,
});

type UserDetail = {
  id: string;
  name: string;
  email: string;
  provider: "google" | "twitter";
  joinDate: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    finalAmount: number;
    status: "payment_completed" | "in_production" | "shipping" | "delivered" | "production_hold";
    quantity: number;
  }>;
  totalSpent: number;
  orderCount: number;
};

export default function AdminUserDetail() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function loadUserDetail() {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/adminGetUserDetail?userId=${userId}`);
        const result = await response.json();
        
        if (result.ok) {
          setUser(result.user);
        } else {
          navigate({ to: "/admin/users" });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        navigate({ to: "/admin/users" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">사용자 상세</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">사용자 상세</h1>
        <div className="text-center py-8">사용자를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">사용자 상세 - {user.name}</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/users" })}>
          목록으로
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserInfoCard user={user} />
        <UserStatsCard user={user} />
      </div>

      <UserOrdersCard orders={user.orders} />
    </div>
  );
}

function UserInfoCard({ user }: { user: UserDetail }) {
  const getProviderBadge = (provider: string) => {
    const badges = {
      google: { text: "Google", variant: "default" as const },
      twitter: { text: "Twitter", variant: "secondary" as const },
    };
    return badges[provider as keyof typeof badges] || { text: provider, variant: "outline" as const };
  };

  const providerBadge = getProviderBadge(user.provider);

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">이름</label>
          <p className="font-medium">{user.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">이메일</label>
          <p>{user.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">로그인 방식</label>
          <div>
            <Badge variant={providerBadge.variant}>{providerBadge.text}</Badge>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">가입일</label>
          <p>{new Date(user.joinDate).toLocaleDateString("ko-KR")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UserStatsCard({ user }: { user: UserDetail }) {
  const stats = [
    {
      label: "총 주문 횟수",
      value: user.orderCount,
      suffix: "건",
      icon: "📦",
    },
    {
      label: "총 주문 금액",
      value: user.totalSpent.toLocaleString(),
      suffix: "원",
      icon: "💰",
    },
    {
      label: "평균 주문 금액",
      value: user.orderCount > 0 ? Math.round(user.totalSpent / user.orderCount).toLocaleString() : "0",
      suffix: "원",
      icon: "📊",
    },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>주문 통계</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl font-bold">
                {stat.value}
                <span className="text-sm font-normal ml-1">{stat.suffix}</span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UserOrdersCard({ orders }: { orders: UserDetail["orders"] }) {
  const getStatusBadge = (status: string) => {
    const badges = {
      payment_completed: { text: "결제완료", variant: "default" as const },
      in_production: { text: "제작중", variant: "secondary" as const },
      shipping: { text: "배송중", variant: "default" as const },
      delivered: { text: "배송완료", variant: "outline" as const },
      production_hold: { text: "제작보류", variant: "destructive" as const },
    };
    return badges[status as keyof typeof badges] || { text: status, variant: "outline" as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>주문 내역 ({orders.length}건)</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            주문 내역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">주문번호</th>
                  <th className="text-left py-3 px-2">주문일</th>
                  <th className="text-left py-3 px-2">수량</th>
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
                        <p className="font-medium">{order.orderNumber}</p>
                      </td>
                      <td className="py-3 px-2">{formatDate(order.orderDate)}</td>
                      <td className="py-3 px-2">{order.quantity}개</td>
                      <td className="py-3 px-2">
                        {order.finalAmount.toLocaleString()}원
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Link to="/admin/orders/$orderId" params={{ orderId: order.id }}>
                          <Button size="sm">상세</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}