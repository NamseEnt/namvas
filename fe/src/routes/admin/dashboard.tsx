import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

type DashboardData = {
  pendingTasks: Array<{
    id: string;
    type: "payment_completed" | "production_hold";
    orderNumber: string;
    customerName: string;
    amount: number;
    createdAt: string;
  }>;
  todayStats: {
    orders: number;
    revenue: number;
    newUsers: number;
  };
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function loadDashboardData() {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/adminGetDashboard");
        const result = await response.json();
        
        if (result.ok) {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!data) {
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

function StatsCards({ stats }: { stats: DashboardData["todayStats"] }) {
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

function PendingTasks({ tasks }: { tasks: DashboardData["pendingTasks"] }) {
  const getTaskBadge = (type: string) => {
    const badges = {
      payment_completed: { text: "결제완료", variant: "default" as const },
      production_hold: { text: "제작보류", variant: "destructive" as const },
    };
    return badges[type as keyof typeof badges] || { text: type, variant: "secondary" as const };
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
          <Link to="/admin/orders">
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
                      <p className="font-medium">{task.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.customerName} • {task.amount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(task.createdAt)}
                    </span>
                    <Link to="/admin/orders/$orderId" params={{ orderId: task.id }}>
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