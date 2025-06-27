import { createContext, useContext, useState, useCallback } from "react";
import { LeftPreviewArea } from "./LeftPreviewArea";
import { RightControlPanel } from "./RightControlPanel";
import { OrderBlock } from "./OrderBlock";
import { type SideProcessing } from "./types";

export type StudioState = {
  uploadedImage: HTMLImageElement | null;
  imageDataUrl: string | null;
  imageScale: number;
  imagePosition: { x: number; y: number };
  sideProcessing: SideProcessing;
  qualityWarning: boolean;
  canvasBackgroundColor: string;
};

const StudioContext = createContext<{
  state: StudioState;
  updateState: (updates: Partial<StudioState>) => void;
  handleImageUpload: (file: File) => void;
  handleScaleChange: (scale: number) => void;
  handlePositionChange: (position: { x: number; y: number }) => void;
  handleOrder: () => void;
} | null>(null);

export const useStudioContext = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudioContext must be used within StudioContext");
  }
  return context;
};

export default function StudioPage() {
  const [state, setState] = useState<StudioState>({
    uploadedImage: null,
    imageDataUrl: null,
    imageScale: 1,
    imagePosition: { x: 0, y: 0 },
    sideProcessing: {
      type: "clip",
    },
    qualityWarning: false,
    canvasBackgroundColor: "dark-pattern",
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

  const handleOrder = useCallback(async () => {
    // TODO
  }, []);

  return (
    <StudioContext.Provider
      value={{
        state,
        updateState: updateState,
        handleImageUpload,
        handleScaleChange,
        handlePositionChange,
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
