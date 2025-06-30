import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { LeftPreviewArea } from "./LeftPreviewArea";
import { type SideProcessing } from "./types";
import { createCrossTexture } from "./canvas-views/createCrossTexture";
import { 
  ToolModeProvider, 
  ModeSelector, 
  ToolsArea, 
  ViewAngleButtons, 
  ImageFitButtons 
} from "./tools";
import { ResponsiveStudioLayout } from "./ResponsiveStudioLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearch } from '@tanstack/react-router';
import { type ArtworkDefinition } from "@/types/artwork";
import { 
  saveArtworkToStorage, 
  saveTextureToStorage,
  getArtworkFromStorage 
} from "@/utils/storageManager";

export type StudioState = {
  uploadedImage: HTMLImageElement | undefined;
  imageDataUrl: string | undefined;
  mmPerPixel: number; // millimeters per pixel ratio
  imageCenterXy: { x: number; y: number }; // in millimeters
  sideProcessing: SideProcessing;
  canvasBackgroundColor: string;
};

type CanvasViewsState = {
  rotation: { x: number; y: number };
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

const CanvasViewsContext = createContext<{
  state: CanvasViewsState;
  updateState: (updates: Partial<CanvasViewsState>) => void;
} | null>(null);

export const useCanvasViewsContext = () => {
  const context = useContext(CanvasViewsContext);
  if (!context) {
    throw new Error(
      "useCanvasViewsContext must be used within CanvasViewsContext"
    );
  }
  return context;
};

export default function StudioPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/studio/' });
  
  // Track if we've already restored from localStorage
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  
  // Get artwork from storage (search params used only as a trigger)
  const [artworkDefinition, setArtworkDefinition] = useState<ArtworkDefinition>();
  
  useEffect(function loadArtworkFromStorage() {
    if (search?.artwork && !hasRestoredFromStorage) {
      getArtworkFromStorage().then(setArtworkDefinition);
    }
  }, [search?.artwork, hasRestoredFromStorage]);

  const [state, setState] = useState<StudioState>({
    uploadedImage: undefined,
    imageDataUrl: undefined,
    mmPerPixel: 1, // will be auto-calculated on image upload
    imageCenterXy: { x: 0, y: 0 }, // in millimeters
    sideProcessing: {
      type: "clip",
    },
    canvasBackgroundColor: "dark-pattern",
  });

  const [canvasViewsState, setCanvasViewsState] = useState<CanvasViewsState>({
    rotation: { x: 0, y: 0 },
  });

  const [canvasTextureImg, setCanvasTextureImg] = useState<HTMLImageElement>();

  const updateState = useCallback((updates: Partial<StudioState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadCanvasTexture = useCallback(() => {
    if (canvasTextureImg) {
      return;
    }
    const img = new Image();
    img.onload = () => setCanvasTextureImg(img);
    img.src = "./canvas-texture.jpg";
  }, [canvasTextureImg]);

  const updateCanvasViewsState = useCallback((updates: Partial<CanvasViewsState>) => {
    setCanvasViewsState((prev) => ({ ...prev, ...updates }));
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
      updateState({ imageCenterXy: position });
    },
    [updateState]
  );

  const handleOrder = useCallback(async () => {
    if (!state.uploadedImage || !state.imageDataUrl) {
      return;
    }

    // Ensure canvas texture is loaded
    if (!canvasTextureImg) {
      loadCanvasTexture();
      // Wait a bit for texture to load
      const img = new Image();
      img.onload = () => {
        setCanvasTextureImg(img);
        // Retry order after texture loads
        setTimeout(() => handleOrder(), 50);
      };
      img.src = "./canvas-texture.jpg";
      return;
    }

    try {
      // Create artwork definition
      const artworkDefinition: ArtworkDefinition = {
        originalImageDataUrl: state.imageDataUrl,
        mmPerPixel: state.mmPerPixel,
        imageCenterXy: state.imageCenterXy,
        sideProcessing: state.sideProcessing,
        canvasBackgroundColor: state.canvasBackgroundColor,
      };

      // Save artwork to storage
      await saveArtworkToStorage(artworkDefinition);

      // Create cross texture for preview
      const crossTexture = createCrossTexture({
        uploadedImage: state.uploadedImage,
        mmPerPixel: state.mmPerPixel,
        imageCenterXy: state.imageCenterXy,
        sideProcessing: state.sideProcessing,
        canvasTextureImg: canvasTextureImg,
      });

      // Convert Three.js texture to data URL
      const canvas = crossTexture.image as HTMLCanvasElement;
      const textureDataUrl = canvas.toDataURL('image/png', 0.9);

      // Save texture to storage
      await saveTextureToStorage(textureDataUrl);

      // Navigate to order page (just as a trigger, no data in URL)
      navigate({
        to: '/order',
        search: {
          fromStudio: 'true',
        },
      });
    } catch (error) {
      console.error('Error creating artwork for order:', error);
    }
  }, [state, canvasTextureImg, loadCanvasTexture, navigate]);

  useEffect(function preloadCanvasTexture() {
    loadCanvasTexture();
  }, [loadCanvasTexture]);

  useEffect(function restoreArtworkFromSearch() {
    if (artworkDefinition && !hasRestoredFromStorage) {
      // Restore artwork state from localStorage
      const img = new Image();
      img.onload = () => {
        setState({
          uploadedImage: img,
          imageDataUrl: artworkDefinition.originalImageDataUrl,
          mmPerPixel: artworkDefinition.mmPerPixel,
          imageCenterXy: artworkDefinition.imageCenterXy,
          sideProcessing: artworkDefinition.sideProcessing,
          canvasBackgroundColor: artworkDefinition.canvasBackgroundColor,
        });
        // Mark as restored to prevent re-running
        setHasRestoredFromStorage(true);
        
        // Remove artwork param from URL to prevent re-renders
        navigate({ to: '/studio', search: { artwork: undefined }, replace: true });
      };
      img.src = artworkDefinition.originalImageDataUrl;
    }
  }, [artworkDefinition, hasRestoredFromStorage, navigate]);

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
      <CanvasViewsContext.Provider
        value={{
          state: canvasViewsState,
          updateState: updateCanvasViewsState,
        }}
      >
        <div className="h-screen bg-background flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ToolModeProvider>
              <ResponsiveStudioLayout
                canvasArea={<LeftPreviewArea />}
                toolsArea={
                  <ToolsArea 
                    viewTools={<ViewAngleButtons />}
                    imageTools={<ImageFitButtons />}
                  />
                }
                modeSelector={<ModeSelector />}
                checkoutButton={
                  <Button
                    onClick={handleOrder}
                    disabled={!state.uploadedImage}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6"
                    size="lg"
                  >
                    주문하기
                  </Button>
                }
              />
            </ToolModeProvider>
          </div>
        </div>
      </CanvasViewsContext.Provider>
    </StudioContext.Provider>
  );
}
