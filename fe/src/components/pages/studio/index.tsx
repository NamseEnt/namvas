import { createContext, useContext, useState, useCallback } from "react";
import { LeftPreviewArea } from "./LeftPreviewArea";
import { RightControlPanel } from "./RightControlPanel";
import { OrderBlock } from "./OrderBlock";
import { type SideProcessing } from "./types";

export type StudioState = {
  uploadedImage: HTMLImageElement | null;
  imageDataUrl: string | null;
  mmPerPixel: number; // millimeters per pixel ratio
  imageCenterXy: { x: number; y: number }; // in millimeters
  sideProcessing: SideProcessing;
  canvasBackgroundColor: string;
};

const StudioContext = createContext<{
  state: StudioState;
  updateState: (updates: Partial<StudioState>) => void;
  handleImageUpload: (file: File) => void;
  handleMmPerPixelChange: (mmPerPixel: number) => void;
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
    mmPerPixel: 1, // will be auto-calculated on image upload
    imageCenterXy: { x: 0, y: 0 }, // in millimeters
    sideProcessing: {
      type: "clip",
    },
    canvasBackgroundColor: "dark-pattern",
  });

  console.log("[STUDIO DEBUG] Current state:", state);

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
          // Auto-fit image so largest dimension fits 4x6 inch canvas
          const canvasWidth = 101.6; // mm (4 inches)
          const canvasHeight = 152.4; // mm (6 inches)
          const maxDimension = Math.max(canvasWidth, canvasHeight);
          
          const imageMaxDimension = Math.max(img.width, img.height);
          const autoFitMmPerPixel = maxDimension / imageMaxDimension;
          
          updateState({
            uploadedImage: img,
            imageDataUrl: dataUrl,
            mmPerPixel: autoFitMmPerPixel,
          });
        };
      };
      reader.readAsDataURL(file);
    },
    [updateState]
  );

  const handleMmPerPixelChange = useCallback(
    (mmPerPixel: number) => {
      updateState({
        mmPerPixel: mmPerPixel,
      });
    },
    [updateState]
  );

  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => {
      console.log("[STUDIO DEBUG] Position change:", position);
      updateState({ imageCenterXy: position });
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
        handleMmPerPixelChange,
        handlePositionChange,
        handleOrder,
      }}
    >
      <div className="h-screen bg-background flex flex-col">
        <div className="flex flex-1 lg:flex-row flex-col overflow-hidden">
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
    <footer className="bg-card border-t border-border py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center text-sm text-muted-foreground">
          © 2024 NAMVAS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
