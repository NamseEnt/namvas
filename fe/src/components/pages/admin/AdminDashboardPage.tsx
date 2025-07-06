import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import type { Order } from "../../../../../shared/types";

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: adminApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="text-center py-8">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      
      <StatsCards stats={data.todayStats} />
      <PendingTasks tasks={data.pendingTasks} />
    </div>
  );
}

function StatsCards({ stats }: { stats: { orders: number; revenue: number; newUsers: number } }) {
  const cards = [
    {
      title: "오늘 주문",
      value: stats.orders,
      suffix: "건",
      icon: "📦",
      color: "text-blue-600",
    },
    {
      title: "오늘 매출",
      value: stats.revenue.toLocaleString(),
      suffix: "원",
      icon: "💰",
      color: "text-green-600",
    },
    {
      title: "신규 가입자",
      value: stats.newUsers,
      suffix: "명",
      icon: "👥",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                  <span className="text-sm font-normal ml-1">{card.suffix}</span>
                </p>
              </div>
              <div className="text-3xl">{card.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PendingTasks({ tasks }: { tasks: Array<{ id: string; type: "payment_completed" | "production_hold"; order: Order }> }) {
  const getTaskBadge = (type: "payment_completed" | "production_hold") => {
    const badges = {
      payment_completed: { text: "결제완료", variant: "default" as const },
      production_hold: { text: "제작보류", variant: "destructive" as const },
    };
    return badges[type];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>처리할 업무 ({tasks.length}건)</span>
          <Link to="/admin/orders" search={{ status: undefined, search: undefined, page: 1 }}>
            <Button variant="outline" size="sm">
              전체 보기
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            처리할 업무가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const badge = getTaskBadge(task.type);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Badge variant={badge.variant}>{badge.text}</Badge>
                    <div>
                      <p className="font-medium">주문 #{task.order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(task.order.orderDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link to="/admin/orders/$orderId" params={{ orderId: task.order.id }} search={undefined as any}>
                      <Button size="sm">처리</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}