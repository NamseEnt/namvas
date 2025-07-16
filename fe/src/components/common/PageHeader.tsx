import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

type PageHeaderProps = {
  title?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title = "NAMVAS", actions }: PageHeaderProps) {
  const {
    data: authData,
    isLoading,
    logout,
    loginWithGoogle,
    loginWithX,
    loginDev,
  } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleXLogin = () => {
    loginWithX();
  };

  const handleDevLogin = () => {
    loginDev("dev-user");
  };

  const renderAuthButtons = () => {
    if (isLoading) {
      return <div className="h-9 w-32 bg-muted rounded animate-pulse" />;
    }

    if (authData?.ok) {
      // 로그인 상태: 네비게이션 메뉴 + 로그아웃
      return (
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/artworks">내 작품</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/my">주문내역</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            로그아웃
          </Button>
        </div>
      );
    } else {
      // 비로그인 상태: 소셜 로그인 버튼들
      return (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoogleLogin}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Google로 시작하기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleXLogin}
            className="text-sky-600 border-sky-200 hover:bg-sky-50"
          >
            X로 시작하기
          </Button>
          {import.meta.env.MODE !== "production" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDevLogin}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              개발 로그인
            </Button>
          )}
        </div>
      );
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold text-foreground tracking-tight hover:text-primary transition-colors"
            >
              {title}
            </Link>
          </div>
          {actions || renderAuthButtons()}
        </div>
      </div>
    </header>
  );
}
