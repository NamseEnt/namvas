import { useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CanvasViews, { useCanvasViewsContext } from "./canvas-views";

type StudioState = {
  uploadedImage: HTMLImageElement | null;
  imageDataUrl: string | null;
  imageScale: number;
  imagePosition: { x: number; y: number };
  canvasAngle: number;
  sideProcessing: "white" | "color" | "mirror";
  defaultColor: string;
  qualityWarning: boolean;
  canvasBackgroundColor: string;
};

const StudioContext = createContext<{
  state: StudioState;
  updateState: (updates: Partial<StudioState>) => void;
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
    canvasBackgroundColor: "dark-pattern",
  });

  const updateState = useCallback((updates: Partial<StudioState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback((file: File) => {
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
  }, []);

  const handleScaleChange = useCallback((scale: number) => {
    const targetResolution = 1772 * 1181;
    const currentResolution = Math.floor(targetResolution * scale * scale);
    const hasWarning = currentResolution < targetResolution;

    updateState({
      imageScale: scale,
      qualityWarning: hasWarning,
    });
  }, []);

  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => {
      updateState({ imagePosition: position });
    },
    []
  );

  const handleAngleChange = useCallback((angle: number) => {
    updateState({ canvasAngle: angle });
  }, []);

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
        updateState: updateState,
        handleImageUpload,
        handleScaleChange,
        handlePositionChange,
        handleAngleChange,
        handleOrder,
      }}
    >
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen lg:flex-row flex-col">
          <LeftPreviewArea />
          <RightControlPanel />
        </div>
        <CommonFooter />
      </div>
    </StudioContext.Provider>
  );
}


function LeftPreviewArea() {
  const { state } = useStudioContext();

  const backgroundOptions = [
    { 
      name: "어두운 회색", 
      value: "dark-pattern",
      style: {
        background: `
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
          #1e293b
        `,
        backgroundSize: '60px 60px'
      }
    },
    { 
      name: "베이지", 
      value: "bg-amber-50",
      style: {}
    },
    { 
      name: "나무결", 
      value: "wood-texture",
      style: {
        background: `
          linear-gradient(90deg, #d4a574 0%, #c89e66 15%, #d4a574 30%, #be9560 45%, #d4a574 60%, #c89e66 75%, #d4a574 100%),
          repeating-linear-gradient(180deg, rgba(190, 149, 96, 0.1) 0px, rgba(190, 149, 96, 0.1) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(0deg, rgba(200, 158, 102, 0.05) 0px, rgba(200, 158, 102, 0.05) 2px, transparent 2px, transparent 15px)
        `,
        backgroundColor: '#d4a574'
      }
    },
    { 
      name: "종이", 
      value: "paper-texture",
      style: {
        background: `
          radial-gradient(circle at 25% 25%, #f5f5dc 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, #f0f0e6 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, #faf0e6 0%, transparent 50%),
          #fefefe
        `,
        backgroundSize: '20px 20px, 25px 25px, 15px 15px, 100%'
      }
    },
    { 
      name: "콘크리트", 
      value: "concrete-texture",
      style: {
        background: `
          radial-gradient(circle at 20% 20%, rgba(200, 200, 200, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 80% 80%, rgba(180, 180, 180, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 60% 40%, rgba(220, 220, 220, 0.2) 0%, transparent 30%),
          linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
          #f0f0f0
        `,
        backgroundSize: '50px 50px, 30px 30px, 40px 40px, 10px 10px, 100%'
      }
    },
    { 
      name: "패브릭", 
      value: "fabric-texture",
      style: {
        background: `
          repeating-linear-gradient(45deg, #f8f8f8 0px, #f8f8f8 2px, #e0e0e0 2px, #e0e0e0 4px),
          repeating-linear-gradient(-45deg, transparent 0px, transparent 2px, rgba(200, 200, 200, 0.1) 2px, rgba(200, 200, 200, 0.1) 4px),
          #f5f5f5
        `
      }
    },
    { 
      name: "도트", 
      value: "dot-pattern",
      style: {
        background: `
          radial-gradient(circle at 50% 50%, #e0e0e0 1.5px, transparent 1.5px),
          #f8f8f8
        `,
        backgroundSize: '25px 25px'
      }
    }
  ];

  const currentOption = backgroundOptions.find(opt => opt.value === state.canvasBackgroundColor);
  const canvasStyle = currentOption && !state.canvasBackgroundColor.startsWith('bg-') 
    ? currentOption.style 
    : {};

  return (
    <div className="flex-1 p-6 bg-background relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">미리보기</h2>
        <CanvasBackgroundSelector />
      </div>

      <div 
        className={`w-full h-[calc(100vh-200px)] border border-border rounded-lg ${state.canvasBackgroundColor.startsWith('bg-') ? state.canvasBackgroundColor : ''}`}
        style={canvasStyle}
      >
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
    updateState,
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
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">사이드 처리</label>
        <div className="grid grid-cols-3 gap-2">
          {(["white", "color", "mirror"] as const).map((option) => (
            <Button
              key={option}
              variant={state.sideProcessing === option ? "default" : "outline"}
              size="sm"
              onClick={() => updateState({ sideProcessing: option })}
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
            onChange={(e) => updateState({ defaultColor: e.target.value })}
            className="w-full mt-2 h-10 rounded border border-border"
          />
        )}
      </div>

      {/* 주문하기 */}
      <div className="border-t border-border pt-6">
        <Button
          onClick={handleOrder}
          disabled={!state.uploadedImage}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          주문하기
        </Button>
      </div>
    </div>
  );
}

function CanvasBackgroundSelector() {
  const { state, updateState } = useStudioContext();

  const backgroundOptions = [
    { 
      name: "어두운 회색", 
      value: "dark-pattern",
      style: {
        background: `
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px),
          #1e293b
        `,
        backgroundSize: '60px 60px'
      }
    },
    { 
      name: "베이지", 
      value: "bg-amber-50",
      style: {}
    },
    { 
      name: "나무결", 
      value: "wood-texture",
      style: {
        background: `
          linear-gradient(90deg, #d4a574 0%, #c89e66 15%, #d4a574 30%, #be9560 45%, #d4a574 60%, #c89e66 75%, #d4a574 100%),
          repeating-linear-gradient(180deg, rgba(190, 149, 96, 0.1) 0px, rgba(190, 149, 96, 0.1) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(0deg, rgba(200, 158, 102, 0.05) 0px, rgba(200, 158, 102, 0.05) 2px, transparent 2px, transparent 15px)
        `,
        backgroundColor: '#d4a574'
      }
    },
    { 
      name: "종이", 
      value: "paper-texture",
      style: {
        background: `
          radial-gradient(circle at 25% 25%, #f5f5dc 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, #f0f0e6 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, #faf0e6 0%, transparent 50%),
          #fefefe
        `,
        backgroundSize: '20px 20px, 25px 25px, 15px 15px, 100%'
      }
    },
    { 
      name: "콘크리트", 
      value: "concrete-texture",
      style: {
        background: `
          radial-gradient(circle at 20% 20%, rgba(200, 200, 200, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 80% 80%, rgba(180, 180, 180, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 60% 40%, rgba(220, 220, 220, 0.2) 0%, transparent 30%),
          linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
          #f0f0f0
        `,
        backgroundSize: '50px 50px, 30px 30px, 40px 40px, 10px 10px, 100%'
      }
    },
    { 
      name: "패브릭", 
      value: "fabric-texture",
      style: {
        background: `
          repeating-linear-gradient(45deg, #f8f8f8 0px, #f8f8f8 2px, #e0e0e0 2px, #e0e0e0 4px),
          repeating-linear-gradient(-45deg, transparent 0px, transparent 2px, rgba(200, 200, 200, 0.1) 2px, rgba(200, 200, 200, 0.1) 4px),
          #f5f5f5
        `
      }
    },
    { 
      name: "도트", 
      value: "dot-pattern",
      style: {
        background: `
          radial-gradient(circle at 50% 50%, #e0e0e0 1.5px, transparent 1.5px),
          #f8f8f8
        `,
        backgroundSize: '25px 25px'
      }
    }
  ];

  return (
    <div className="flex gap-1">
      {backgroundOptions.map((option) => (
        <Button
          key={option.value}
          variant={state.canvasBackgroundColor === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => updateState({ canvasBackgroundColor: option.value })}
          className="text-xs"
        >
          {option.name}
        </Button>
      ))}
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
