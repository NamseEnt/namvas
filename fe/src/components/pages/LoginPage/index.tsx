import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithGoogle, loginWithX } = useAuth();

  useEffect(function redirectIfAuthenticated() {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5ebe0] to-[#ede0d4]">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
          {/* 로고 */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-bold text-amber-900 mb-2 tracking-wider">
              namvas
            </h1>
            <p className="text-amber-700">프리미엄 캔버스 굿즈 서비스</p>
          </div>

          {/* 환영 메시지 */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-amber-950 mb-2">
              환영합니다
            </h2>
            <p className="text-amber-700">
              로그인하여 나만의 캔버스를 만들어보세요
            </p>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-4">
            <Button
              onClick={loginWithGoogle}
              size="lg"
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full py-6 font-medium transition-all duration-200 flex items-center justify-center gap-3"
            >
              <GoogleIcon />
              구글로 시작하기
            </Button>

            <Button
              onClick={loginWithX}
              size="lg"
              className="w-full bg-black hover:bg-gray-900 text-white rounded-full py-6 font-medium transition-all duration-200 flex items-center justify-center gap-3"
            >
              <XIcon />
              X(트위터)로 시작하기
            </Button>
          </div>

          {/* 구분선 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">또는</span>
            </div>
          </div>

          {/* 둘러보기 링크 */}
          <div className="text-center">
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-amber-700 hover:text-amber-900 underline transition-colors"
            >
              로그인 없이 둘러보기
            </button>
          </div>

          {/* 이용약관 */}
          <p className="text-xs text-gray-500 text-center mt-8">
            로그인 시{" "}
            <a href="/terms" className="underline hover:text-gray-700">
              이용약관
            </a>
            과{" "}
            <a href="/privacy" className="underline hover:text-gray-700">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}