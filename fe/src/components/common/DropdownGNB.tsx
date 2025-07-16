import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function DropdownGNB() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: authData, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(function handleClickOutside() {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  useEffect(function handleEscapeKey() {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const handleMenuClick = (callback: () => void) => {
    return () => {
      callback();
      setIsOpen(false);
    };
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-4 flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="메뉴 열기"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link
            to={authData?.ok ? "/artworks" : "/"}
            className="ml-3 text-xl font-bold tracking-tight hover:text-gray-700 transition-colors"
          >
            NAMVAS
          </Link>
        </div>
      </header>

      {/* 드롭다운 메뉴 */}
      <div
        className={cn(
          "fixed top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg transition-all duration-200 ease-in-out z-40",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <nav className="">
          {authData?.ok ? (
            <>
              {/* 로그인 상태 메뉴 */}
              <div className="py-2">
                <Link
                  to="/artworks"
                  onClick={handleMenuClick(() => {})}
                  className="block px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  내 작품
                </Link>
                <Link
                  to="/studio"
                  onClick={handleMenuClick(() => {})}
                  className="block px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  새 작품 만들기
                </Link>
              </div>
              
              <div className="border-t border-gray-100 py-2">
                <Link
                  to="/build-order"
                  onClick={handleMenuClick(() => {})}
                  className="block px-6 py-3 hover:bg-gray-50 transition-colors font-medium text-blue-600"
                >
                  주문하기
                </Link>
                <Link
                  to="/my"
                  onClick={handleMenuClick(() => {})}
                  className="block px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  주문 내역
                </Link>
                <Link
                  to="/support"
                  onClick={handleMenuClick(() => {})}
                  className="block px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  고객센터
                </Link>
              </div>

              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-6 py-3 hover:bg-gray-50 transition-colors text-red-600"
                >
                  로그아웃
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 비로그인 상태 메뉴 */}
              <div className="py-4 px-6">
                <p className="text-gray-600 mb-4">NAMVAS를 시작하려면 로그인하세요</p>
                <div className="space-y-2">
                  <button
                    onClick={handleMenuClick(() => navigate({ to: "/login" }))}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    로그인
                  </button>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          style={{ top: "56px" }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}