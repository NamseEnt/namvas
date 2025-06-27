import { useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useState, useCallback } from "react";
import { LeftPreviewArea } from "./LeftPreviewArea";
import { RightControlPanel } from "./RightControlPanel";
import { OrderBlock } from "./OrderBlock";

export type StudioState = {
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
} | null>(null);

export const useStudioContext = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudioContext must be used within StudioContext');
  }
  return context;
};

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
  }, [updateState]);

  const handleScaleChange = useCallback((scale: number) => {
    const targetResolution = 1772 * 1181;
    const currentResolution = Math.floor(targetResolution * scale * scale);
    const hasWarning = currentResolution < targetResolution;

    updateState({
      imageScale: scale,
      qualityWarning: hasWarning,
    });
  }, [updateState]);

  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => {
      updateState({ imagePosition: position });
    },
    [updateState]
  );

  const handleAngleChange = useCallback((angle: number) => {
    updateState({ canvasAngle: angle });
  }, [updateState]);

  const handleOrder = useCallback(async () => {
    if (!state.uploadedImage || !state.imageDataUrl) {
      return;
    }

    // 최종 렌더링을 위한 캔버스 생성
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

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
        if (!blob) {
          return;
        }

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
          <RightSideArea />
        </div>
        <CommonFooter />
      </div>
    </StudioContext.Provider>
  );
}


function RightSideArea() {
  return (
    <div className="w-full lg:w-80 flex flex-col bg-card border-l border-border">
      <RightControlPanel />
      <OrderBlock />
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
