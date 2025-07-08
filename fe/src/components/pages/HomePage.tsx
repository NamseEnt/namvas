import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type HomePageState = {
  isLoginModalOpen: boolean;
};

const HomePageContext = createContext<{
  state: HomePageState;
  updateState: (updates: Partial<HomePageState>) => void;
  handleCreateCanvas: () => void;
  handleGoogleLogin: () => void;
  handleXLogin: () => void;
  handleLogout: () => void;
  isLoadingAuth: boolean;
}>(null!);

const useHomePageContext = () => useContext(HomePageContext);

export function HomePage() {
  const [state, setState] = useState<HomePageState>({
    isLoginModalOpen: false,
  });
  
  const navigate = useNavigate();
  
  // 인증 상태와 네비게이션에 필요한 부분만 가져옴
  const {
    isLoading: isLoadingAuth,
    logout,
    isLoggingOut,
    loginWithGoogle,
    loginWithX,
    isAuthenticated
  } = useAuth();

  const updateState = (updates: Partial<HomePageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleCreateCanvas = () => {
    if (isAuthenticated) {
      navigate({ to: '/studio', search: { artwork: undefined } });
    } else {
      updateState({ isLoginModalOpen: true });
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleXLogin = () => {
    loginWithX();
  };

  return (
    <HomePageContext.Provider
      value={{
        state,
        updateState,
        handleCreateCanvas,
        handleGoogleLogin,
        handleXLogin,
        handleLogout,
        isLoadingAuth: isLoadingAuth || isLoggingOut,
      }}
    >
      <div className="min-h-screen flex flex-col bg-background">
        <PageHeader />
        <MainContent />
        <PageFooter />
        <LoginModal />
      </div>
    </HomePageContext.Provider>
  );
}

function PageHeader() {
  const { handleGoogleLogin, handleXLogin, handleLogout, isLoadingAuth } = useHomePageContext();
  const { user } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              NAMVAS
            </h1>
          </div>
          <div className="flex gap-3">
            {isLoadingAuth ? (
              <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            ) : user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                로그아웃
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MainContent() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <ProductShowcase />
        <ValueProposition />
        <CTASection />
      </div>
    </main>
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

function PageFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center gap-8">
          <a
            href="https://x.com/messages/compose?recipient_id=NAMVAS_X_ID"
            className="text-muted-foreground hover:text-sky-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <X className="w-5 h-5" />
          </a>
          <div className="flex gap-6 text-sm">
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              서비스 이용약관
            </a>
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LoginModal() {
  const { state, updateState, handleGoogleLogin, handleXLogin } =
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
        </div>
      </DialogContent>
    </Dialog>
  );
}