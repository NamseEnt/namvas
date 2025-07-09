import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";

type LoginIntent = "general" | "for-studio";

type LoginIntentState = {
  intent: LoginIntent;
  setIntent: (intent: LoginIntent) => void;
};

const LoginIntentContext = createContext<LoginIntentState | null>(null);

export function LoginIntentProvider({ children }: { children: React.ReactNode }) {
  const [intent, setIntent] = useState<LoginIntent>("general");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 로그인 성공 시 의도에 따라 동작 (로그인 모달에서만)
  useEffect(
    function handleLoginSuccessByIntent() {
      // 홈페이지의 로그인 모달에서 로그인했을 때만 동작
      // 다른 페이지에서의 AuthGuard 리다이렉트와 구분하기 위해 sessionStorage 사용
      const isFromLoginModal = sessionStorage.getItem("login-modal-intent") === "for-studio";
      
      if (isAuthenticated && intent === "for-studio" && isFromLoginModal) {
        // Studio 의도로 로그인했으면 Studio로 이동
        navigate({ to: "/studio", search: { artwork: undefined } });
        // 의도 초기화
        setIntent("general");
        sessionStorage.removeItem("login-modal-intent");
      }
    },
    [isAuthenticated, intent, navigate]
  );

  return (
    <LoginIntentContext.Provider value={{ intent, setIntent }}>
      {children}
    </LoginIntentContext.Provider>
  );
}

export function useLoginIntent() {
  const context = useContext(LoginIntentContext);
  if (!context) {
    throw new Error("useLoginIntent must be used within LoginIntentProvider");
  }
  return context;
}