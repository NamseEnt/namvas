import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/studio")({
  component: Studio,
});

type StudioState = {
  uploadedImage: File | null;
  imageDataUrl: string | null;
  imageScale: number;
  imagePosition: { x: number; y: number };
  canvasAngle: number;
  sideProcessing: "white" | "color" | "mirror";
  sideColor: string;
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

const useStudioContext = () => useContext(StudioContext);

export default function Studio() {
  const navigate = useNavigate();
  const [state, setState] = useState<StudioState>({
    uploadedImage: null,
    imageDataUrl: null,
    imageScale: 1,
    imagePosition: { x: 0, y: 0 },
    canvasAngle: 0,
    sideProcessing: "white",
    sideColor: "#ffffff",
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
        updateState({
          uploadedImage: file,
          imageDataUrl: dataUrl,
        });
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

    // Create Canvas API rendering for 300DPI final image
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
        state.sideProcessing === "white" ? "#ffffff" : state.sideColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply transformations and draw image
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(state.imageScale, state.imageScale);
      ctx.translate(state.imagePosition.x, state.imagePosition.y);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Convert to blob and send to server
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "final-design.png");
        formData.append("sideProcessing", state.sideProcessing);
        formData.append("sideColor", state.sideColor);

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

function MultiAnglePreview() {
  const { state, handlePositionChange, handleScaleChange } = useStudioContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!state.imageDataUrl) return;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - state.imagePosition.x,
        y: e.clientY - state.imagePosition.y,
      });
    },
    [state.imageDataUrl, state.imagePosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handlePositionChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart, handlePositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!state.imageDataUrl) return;
      e.preventDefault();
      const newScale = Math.max(
        0.1,
        Math.min(3, state.imageScale - e.deltaY * 0.001)
      );
      handleScaleChange(newScale);
    },
    [state.imageDataUrl, state.imageScale, handleScaleChange]
  );

  const viewConfigs = [
    { id: 0, transform: "rotateX(-90deg)", gridArea: "view-0" },
    { id: 1, transform: "rotateX(-45deg) rotateY(-45deg)", gridArea: "view-1" },
    { id: 2, transform: "rotateX(-45deg)", gridArea: "view-2" },
    { id: 3, transform: "rotateX(-45deg) rotateY(45deg)", gridArea: "view-3" },
    { id: 4, transform: "rotateY(-90deg)", gridArea: "view-4" },
    { id: 5, transform: "rotateY(-45deg)", gridArea: "view-5" },
    { id: 6, transform: "rotateY(0deg)", gridArea: "view-6" },
    { id: 7, transform: "rotateY(45deg)", gridArea: "view-7" },
    { id: 8, transform: "rotateY(90deg)", gridArea: "view-8" },
    { id: 9, transform: "rotateX(90deg)", gridArea: "view-9" },
  ];

  const gridStyle = {
    display: "grid",
    gridTemplateAreas: `
      "view-1 view-1 view-0 view-0 view-3 view-3"
      "view-1 view-1 view-2 view-2 view-3 view-3"
      "view-4 view-5 view-6 view-6 view-7 view-8"
      "view-4 view-5 view-6 view-6 view-7 view-8"
      ". . view-9 view-9 . ."
    `,
    gridTemplateColumns: "repeat(6, 1fr)",
    gridTemplateRows: "repeat(5, 1fr)",
    gap: "8px",
    height: "100%",
    minHeight: "600px",
  };

  return (
    <div className="h-full w-full p-4">
      <div style={gridStyle}>
        {viewConfigs.map((view) => (
          <AngleView
            key={view.id}
            viewId={view.id}
            transform={view.transform}
            gridArea={view.gridArea}
            isMainView={view.id === 6}
            onMouseDown={view.id === 6 ? handleMouseDown : undefined}
            onMouseMove={view.id === 6 ? handleMouseMove : undefined}
            onMouseUp={view.id === 6 ? handleMouseUp : undefined}
            onWheel={view.id === 6 ? handleWheel : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function AngleView({
  viewId,
  transform,
  gridArea,
  isMainView,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
}: {
  viewId: number;
  transform: string;
  gridArea: string;
  isMainView: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: () => void;
  onWheel?: (e: React.WheelEvent) => void;
}) {
  const { state } = useStudioContext();

  const getSideBackground = () => {
    if (viewId === 6) return "#ffffff";
    
    switch (state.sideProcessing) {
      case "white":
        return "#ffffff";
      case "color":
        return state.sideColor;
      case "mirror":
        return `url(${state.imageDataUrl})`;
      default:
        return "#ffffff";
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border overflow-hidden transition-all",
        isMainView ? "cursor-move shadow-lg" : "cursor-default shadow-sm",
        isMainView && "ring-2 ring-primary/20"
      )}
      style={{
        gridArea,
        perspective: "1000px",
        minHeight: isMainView ? "200px" : "80px",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        className="w-full h-full relative"
        style={{
          transform: `${transform} perspective(800px)`,
          transformStyle: "preserve-3d",
          background: getSideBackground(),
          backgroundSize: state.sideProcessing === "mirror" ? "cover" : "auto",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${state.imageDataUrl})`,
            transform: `translate(${state.imagePosition.x * (isMainView ? 1 : 0.3)}px, ${state.imagePosition.y * (isMainView ? 1 : 0.3)}px) scale(${state.imageScale})`,
            transformOrigin: "center",
            opacity: viewId === 6 ? 1 : 0.8,
          }}
        />
        {!isMainView && (
          <div className="absolute top-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
            {viewId}
          </div>
        )}
        {isMainView && (
          <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            메인 뷰
          </div>
        )}
      </div>
    </div>
  );
}

function LeftPreviewArea() {
  const { state, handleImageUpload } = useStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));
      if (imageFile) {
        handleImageUpload(imageFile);
      }
    },
    [handleImageUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex-1 p-6 relative">
      {!state.imageDataUrl ? (
        <div className="h-full flex flex-col items-center justify-center">
          <div
            className="w-full max-w-2xl h-96 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center p-8 transition-colors cursor-pointer hover:border-primary hover:bg-accent/50"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={handleUploadClick}
          >
            <p className="text-lg text-muted-foreground">
              여기에 사진을 드래그 앤 드롭 하거나 클릭하여 업로드하세요.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
        </div>
      ) : (
        <MultiAnglePreview />
      )}
    </div>
  );
}

function RightControlPanel() {
  const { state, setState, handleImageUpload, handleScaleChange, handleOrder } =
    useStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handleRemoveImage = useCallback(() => {
    setState({
      uploadedImage: null,
      imageDataUrl: null,
      imageScale: 1,
      imagePosition: { x: 0, y: 0 },
      qualityWarning: false,
    });
  }, [setState]);

  return (
    <div className="w-full lg:w-80 bg-card border-l border-border p-6 relative">
      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-medium mb-3">1. 이미지</h3>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full mb-3"
            variant="outline"
          >
            내 컴퓨터에서 사진 찾기
          </Button>
          {state.uploadedImage && (
            <div className="text-sm">
              <p className="mb-2">{state.uploadedImage.name}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  변경
                </Button>
                <Button size="sm" variant="outline" onClick={handleRemoveImage}>
                  삭제
                </Button>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
        </section>

        <section>
          <h3 className="text-sm font-medium mb-3">2. 편집</h3>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() =>
                handleScaleChange(Math.max(0.1, state.imageScale - 0.1))
              }
              className="w-8 h-8 border border-border rounded flex items-center justify-center text-sm hover:bg-accent"
            >
              −
            </button>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={state.imageScale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            <button
              onClick={() =>
                handleScaleChange(Math.min(3, state.imageScale + 0.1))
              }
              className="w-8 h-8 border border-border rounded flex items-center justify-center text-sm hover:bg-accent"
            >
              +
            </button>
          </div>
          {state.qualityWarning && (
            <p className="text-sm text-destructive">
              ❗ 이미지를 너무 확대하여 인쇄 품질이 저하될 수 있습니다.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium mb-3">3. 옆면 처리</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sideProcessing"
                value="white"
                checked={state.sideProcessing === "white"}
                onChange={(e) =>
                  setState({ sideProcessing: e.target.value as "white" })
                }
              />
              <span className="text-sm">흰색으로 비우기</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sideProcessing"
                value="color"
                checked={state.sideProcessing === "color"}
                onChange={(e) =>
                  setState({ sideProcessing: e.target.value as "color" })
                }
              />
              <span className="text-sm">단색 채우기</span>
            </label>
            {state.sideProcessing === "color" && (
              <div className="ml-6 flex items-center gap-2">
                <input
                  type="color"
                  value={state.sideColor}
                  onChange={(e) => setState({ sideColor: e.target.value })}
                  className="w-8 h-8 rounded border border-border"
                />
                <input
                  type="text"
                  value={state.sideColor}
                  onChange={(e) => setState({ sideColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1 px-2 py-1 text-sm border border-border rounded"
                />
              </div>
            )}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sideProcessing"
                value="mirror"
                checked={state.sideProcessing === "mirror"}
                onChange={(e) =>
                  setState({ sideProcessing: e.target.value as "mirror" })
                }
              />
              <span className="text-sm">이미지 미러랩</span>
            </label>
          </div>
        </section>
      </div>

      <div className="sticky bottom-6 mt-8">
        <Button
          onClick={handleOrder}
          disabled={!state.imageDataUrl}
          className="w-full"
        >
          이대로 주문하기
        </Button>
      </div>
    </div>
  );
}

function CommonFooter() {
  return (
    <footer className="border-t border-border bg-card p-6">
      <div className="flex items-center justify-center gap-4">
        <a
          href="https://twitter.com/messages"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:text-primary"
        >
          Twitter DM
        </a>
        <a href="/terms" className="text-sm hover:text-primary">
          서비스 이용약관
        </a>
        <a href="/privacy" className="text-sm hover:text-primary">
          개인정보처리방침
        </a>
      </div>
    </footer>
  );
}
