import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

export default function AdminLayout() {
  const navigate = useNavigate();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['adminAuth'],
    queryFn: authApi.getMe,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      navigate({ to: "/admin/login" });
    },
  });

  if (error || (!isLoading && !user)) {
    navigate({ to: "/admin/login" });
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">인증 확인 중...</h2>
          <p className="text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">관리자 페이지</h1>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            로그아웃
          </Button>
        </div>
      </header>
      
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminSidebar() {
  const menuItems = [
    { to: "/admin/dashboard", label: "대시보드", icon: "📊" },
    { to: "/admin/orders", label: "주문 관리", icon: "📦" },
    { to: "/admin/users", label: "사용자 관리", icon: "👥" },
    { to: "/admin/settings", label: "사이트 관리", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                activeProps={{
                  className: "bg-blue-50 text-blue-600 hover:bg-blue-50",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}