import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CanvasViews from "./_canvas-views";

export const Route = createFileRoute("/studio/")({
  component: StudioPage,
});

type StudioState = {
  uploadedImage: HTMLImageElement | null;
  imageDataUrl: string | null;
  imageScale: number;
  imagePosition: { x: number; y: number };
  canvasAngle: number;
  sideProcessing: "white" | "color" | "mirror";
  defaultColor: string;
  qualityWarning: boolean;
};

const StudioContext = createContext<{
  state: StudioState;
  setState: (updates: Partial<StudioState>) => void;
  handleImageUpload: (file: File) => void;
  handleScaleChange: (scale: number) => void;
  handlePositionChange: (position: { x: number; y: number }) => void;
  handleAngleChange: (angle: number) => void;
  handleOrder: () => void;
}>(null as any);

export const useStudioContext = () => useContext(StudioContext);

export default function StudioPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<StudioState>({
    uploadedImage: null,
    imageDataUrl: null,
    imageScale: 1,
    imagePosition: { x: 0, y: 0 },
    canvasAngle: 0,
    sideProcessing: "white",
    defaultColor: "#ffffff",
    qualityWarning: false,
  });

  const updateState = useCallback((updates: Partial<StudioState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          updateState({
            uploadedImage: img,
            imageDataUrl: dataUrl,
          });
        };
      };
      reader.readAsDataURL(file);
    },
    [updateState]
  );

  const handleScaleChange = useCallback(
    (scale: number) => {
      const targetResolution = 1772 * 1181;
      const currentResolution = Math.floor(targetResolution * scale * scale);
      const hasWarning = currentResolution < targetResolution;

      updateState({
        imageScale: scale,
        qualityWarning: hasWarning,
      });
    },
    [updateState]
  );

  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => {
      updateState({ imagePosition: position });
    },
    [updateState]
  );

  const handleAngleChange = useCallback(
    (angle: number) => {
      updateState({ canvasAngle: angle });
    },
    [updateState]
  );

  const handleOrder = useCallback(async () => {
    if (!state.uploadedImage || !state.imageDataUrl) return;

    // 최종 렌더링을 위한 캔버스 생성
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to 300DPI for 10x15cm (approx 1181x1772 pixels at 300DPI)
    canvas.width = 1181;
    canvas.height = 1772;

    const img = new Image();
    img.onload = async () => {
      // Clear canvas and apply side processing
      ctx.fillStyle =
        state.sideProcessing === "white" ? "#ffffff" : state.defaultColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply transformations and draw image
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(state.imageScale, state.imageScale);
      ctx.translate(state.imagePosition.x, state.imagePosition.y);
      ctx.rotate((state.canvasAngle * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Convert to blob and send to server
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "final-design.png");
        formData.append("sideProcessing", state.sideProcessing);
        formData.append("sideColor", state.defaultColor);

        // TODO: Replace with actual API endpoint
        try {
          const response = await fetch("/api/orders", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const { orderId } = await response.json();
            navigate({ to: `/order/${orderId}` });
          }
        } catch (error) {
          console.error("Order submission failed:", error);
        }
      }, "image/png");
    };
    img.src = state.imageDataUrl;
  }, [state, navigate]);

  return (
    <StudioContext.Provider
      value={{
        state,
        setState: updateState,
        handleImageUpload,
        handleScaleChange,
        handlePositionChange,
        handleAngleChange,
        handleOrder,
      }}
    >
      <div className="min-h-screen bg-background">
        <GlobalNavigationBar />
        <div className="flex min-h-[calc(100vh-64px)] lg:flex-row flex-col">
          <LeftPreviewArea />
          <RightControlPanel />
        </div>
        <CommonFooter />
      </div>
    </StudioContext.Provider>
  );
}

function GlobalNavigationBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    navigate({ to: "/" });
  };

  return (
    <nav className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">
        NAMVAS
      </Link>
      <div className="flex items-center gap-4">
        <button className="text-sm hover:text-primary">마이페이지</button>
        <button onClick={handleLogout} className="text-sm hover:text-primary">
          로그아웃
        </button>
      </div>
    </nav>
  );
}

function LeftPreviewArea() {
  const { state } = useStudioContext();

  return (
    <div className="flex-1 p-6 bg-background relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">미리보기</h2>
      </div>

      <div className="w-full h-[600px] border border-border rounded-lg bg-card">
        <CanvasViews />
      </div>

      {state.qualityWarning && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 현재 해상도가 권장 해상도보다 낮습니다. 인쇄 품질이 저하될 수
            있어요.
          </p>
        </div>
      )}
    </div>
  );
}

function RightControlPanel() {
  const {
    state,
    setState,
    handleImageUpload,
    handleScaleChange,
    handlePositionChange,
    handleAngleChange,
    handleOrder,
  } = useStudioContext();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="w-full lg:w-80 p-6 bg-card border-l border-border">
      <h2 className="text-lg font-semibold mb-6">편집 도구</h2>

      {/* 이미지 업로드 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">이미지 업로드</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
      </div>

      {/* 크기 조절 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          크기: {Math.round(state.imageScale * 100)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={state.imageScale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 위치 조절 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">위치 조절</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">
              X: {state.imagePosition.x.toFixed(1)}
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={state.imagePosition.x}
              onChange={(e) =>
                handlePositionChange({
                  ...state.imagePosition,
                  x: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">
              Y: {state.imagePosition.y.toFixed(1)}
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={state.imagePosition.y}
              onChange={(e) =>
                handlePositionChange({
                  ...state.imagePosition,
                  y: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 회전 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          회전: {state.canvasAngle}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          value={state.canvasAngle}
          onChange={(e) => handleAngleChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 사이드 처리 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">사이드 처리</label>
        <div className="grid grid-cols-3 gap-2">
          {(["white", "color", "mirror"] as const).map((option) => (
            <Button
              key={option}
              variant={state.sideProcessing === option ? "default" : "outline"}
              size="sm"
              onClick={() => setState({ sideProcessing: option })}
            >
              {option === "white"
                ? "화이트"
                : option === "color"
                  ? "컬러"
                  : "미러"}
            </Button>
          ))}
        </div>
        {state.sideProcessing === "color" && (
          <input
            type="color"
            value={state.defaultColor}
            onChange={(e) => setState({ defaultColor: e.target.value })}
            className="w-full mt-2 h-10 rounded border border-border"
          />
        )}
      </div>

      {/* 주문하기 */}
      <Button
        onClick={handleOrder}
        disabled={!state.uploadedImage}
        className="w-full"
        size="lg"
      >
        주문하기
      </Button>
    </div>
  );
}

function CommonFooter() {
  return (
    <footer className="bg-card border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 NAMVAS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
