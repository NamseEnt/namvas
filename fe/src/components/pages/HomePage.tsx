import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLoginIntent } from "@/contexts/LoginIntentContext";

type HomePageState = {
  isLoginModalOpen: boolean;
};

const HomePageContext = createContext<{
  state: HomePageState;
  updateState: (updates: Partial<HomePageState>) => void;
  handleCreateCanvas: () => void;
  handleGoogleLogin: () => void;
  handleXLogin: () => void;
  handleDevLogin: () => void;
}>(null!);

const useHomePageContext = () => useContext(HomePageContext);

export function HomePage() {
  const [state, setState] = useState<HomePageState>({
    isLoginModalOpen: false,
  });
  
  const navigate = useNavigate();
  const { setIntent } = useLoginIntent();
  
  // 인증 상태와 네비게이션에 필요한 부분만 가져옴
  const {
    loginWithGoogle,
    loginWithX,
    loginDev,
    isAuthenticated
  } = useAuth();

  const updateState = (updates: Partial<HomePageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleCreateCanvas = () => {
    if (isAuthenticated) {
      navigate({ to: '/studio', search: { artwork: undefined } });
    } else {
      setIntent("for-studio"); // Studio 이동 의도 설정
      sessionStorage.setItem("login-modal-intent", "for-studio"); // 로그인 모달 출처 마킹
      updateState({ isLoginModalOpen: true });
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleXLogin = () => {
    loginWithX();
  };

  const handleDevLogin = () => {
    loginDev('dev-user');
  };

  // 로그인 성공 시 모달 닫기
  useEffect(
    function closeModalOnLogin() {
      if (isAuthenticated && state.isLoginModalOpen) {
        updateState({ isLoginModalOpen: false });
      }
    },
    [isAuthenticated, state.isLoginModalOpen]
  );

  return (
    <HomePageContext.Provider
      value={{
        state,
        updateState,
        handleCreateCanvas,
        handleGoogleLogin,
        handleXLogin,
        handleDevLogin,
      }}
    >
      <MainContent />
      <LoginModal />
    </HomePageContext.Provider>
  );
}


function MainContent() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <ProductShowcase />
        <ValueProposition />
        <CTASection />
      </div>
    </div>
  );
}

function ProductShowcase() {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative">
        <div
          className="w-52 h-80 bg-amber-800 rounded-lg p-3 shadow-2xl transform perspective-1000"
          style={{
            transform: "perspective(400px) rotateX(5deg) rotateY(-5deg)",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
            alt="10x15cm 원목 캔버스 예시"
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      </div>
    </div>
  );
}

function ValueProposition() {
  return (
    <div className="space-y-4">
      <h2 className="text-4xl font-bold text-foreground leading-tight">
        나만의 순간을 10x15cm 원목 캔버스에 담아보세요
      </h2>
    </div>
  );
}

function CTASection() {
  const { handleCreateCanvas } = useHomePageContext();

  return (
    <div className="pt-4">
      <Button
        size="lg"
        onClick={handleCreateCanvas}
        className="text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-shadow"
      >
        나만의 10x15cm 캔버스 만들기
      </Button>
    </div>
  );
}


function LoginModal() {
  const { state, updateState, handleGoogleLogin, handleXLogin, handleDevLogin } =
    useHomePageContext();

  return (
    <Dialog
      open={state.isLoginModalOpen}
      onOpenChange={(open) => updateState({ isLoginModalOpen: open })}
    >
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            로그인하고 시작하기
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 text-base font-medium bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          >
            Google로 시작하기
          </Button>
          <Button
            onClick={handleXLogin}
            className="w-full h-12 text-base font-medium bg-black text-white hover:bg-gray-800"
          >
            X로 시작하기
          </Button>
          {import.meta.env.MODE !== 'production' && (
            <Button
              onClick={handleDevLogin}
              className="w-full h-12 text-base font-medium bg-green-600 text-white hover:bg-green-700"
            >
              개발 로그인
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}