import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
  validateSearch: (search: Record<string, unknown>) => ({
    search: search.search as string | undefined,
    page: search.page ? Number(search.page) : 1,
  }),
});

type User = {
  id: string;
  name: string;
  email: string;
  provider: "google" | "twitter";
  joinDate: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
};

type UsersData = {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { search, page } = Route.useSearch();
  const [data, setData] = useState<UsersData>();
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search || "");

  useEffect(
    function loadUsersData() {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const params = new URLSearchParams();
          if (search) {
            params.append("search", search);
          }
          params.append("page", page.toString());
          params.append("limit", "20");

          const response = await fetch(`/api/adminGetUsers?${params}`);
          const result = await response.json();

          if (result.ok) {
            setData(result);
          }
        } catch (error) {
          console.error("Failed to load users:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    },
    [search, page]
  );

  const handleSearch = () => {
    navigate({
      to: "/admin/users",
      search: { search: searchInput, page: 1 },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      to: "/admin/users",
      search: { search, page: newPage },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <div className="flex space-x-2">
          <Input
            placeholder="이름 또는 이메일 검색"
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

      {data && (
        <>
          <UsersTable users={data.users} />
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

function UsersTable({ users }: { users: User[] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const getProviderBadge = (provider: string) => {
    const badges = {
      google: { text: "Google", variant: "default" as const },
      twitter: { text: "Twitter", variant: "secondary" as const },
    };
    return (
      badges[provider as keyof typeof badges] || {
        text: provider,
        variant: "outline" as const,
      }
    );
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          검색 조건에 맞는 사용자가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>사용자 목록 ({users.length}명)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">사용자</th>
                <th className="text-left py-3 px-2">가입일</th>
                <th className="text-left py-3 px-2">주문 통계</th>
                <th className="text-left py-3 px-2">최근 주문</th>
                <th className="text-left py-3 px-2">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const providerBadge = getProviderBadge(user.provider);
                return (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge variant={providerBadge.variant} className="mt-1">
                          {providerBadge.text}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-2">{formatDate(user.joinDate)}</td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{user.orderCount}건</p>
                        <p className="text-sm text-muted-foreground">
                          {user.totalSpent.toLocaleString()}원
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      {user.lastOrderDate
                        ? formatDate(user.lastOrderDate)
                        : "없음"}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        to="/admin/users/$userId"
                        params={{ userId: user.id }}
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
