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
  getArtworkFromStorage,
  clearStorage,
  saveImageToStorage,
  getImageFromStorage,
  saveMetadataToStorage,
  getMetadataFromStorage
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
  handleClearWork: () => void;
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
  
  
  // Track if we've already restored from storage
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);
  
  // Get artwork from storage (search params used only as a trigger)
  const [artworkDefinition, setArtworkDefinition] = useState<ArtworkDefinition>();
  
  useEffect(function loadArtworkFromStorage() {
    if (!hasRestoredFromStorage) {
      // Load image and metadata separately
      Promise.all([
        getImageFromStorage(),
        getMetadataFromStorage()
      ]).then(([imageDataUrl, metadata]) => {
        if (imageDataUrl && metadata) {
          setArtworkDefinition({
            originalImageDataUrl: imageDataUrl,
            ...metadata
          });
        }
      });
    }
  }, [hasRestoredFromStorage]);

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
    rotation: { x: 0, y: 0 }, // Start from front view for animation
  });
  
  // Track if initial animation has been played
  const [hasPlayedInitialAnimation, setHasPlayedInitialAnimation] = useState(false);

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
        img.onload = async () => {
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
          
          // Save image separately
          await saveImageToStorage(dataUrl);
          
          // Save initial metadata
          await saveMetadataToStorage({
            mmPerPixel: autoFitMmPerPixel,
            imageCenterXy: { x: 0, y: 0 },
            sideProcessing: { type: "clip" },
            canvasBackgroundColor: "#FFFFFF",
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

  const handleClearWork = useCallback(async () => {
    if (!confirm("정말 초기화하시겠습니까? 현재 작업 내용이 모두 삭제됩니다.")) {
      return;
    }
    
    // Clear OPFS storage
    await clearStorage();
    
    // Reset restoration flag to true to prevent re-loading
    setHasRestoredFromStorage(true);
    
    // Reset all state to initial values
    setState({
      uploadedImage: undefined,
      imageDataUrl: undefined,
      mmPerPixel: 1,
      imageCenterXy: { x: 0, y: 0 },
      sideProcessing: {
        type: "clip",
      },
      canvasBackgroundColor: "#FFFFFF",
    });
  }, []);

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
      console.log('[DEBUG] Saving texture to OPFS...');
      await saveTextureToStorage(textureDataUrl);

      // Navigate to order page (just as a trigger, no data in URL)
      console.log('[DEBUG] Navigating to order page...');
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

  // Initial animation when image is uploaded
  useEffect(function animateInitialCameraPosition() {
    if (state.uploadedImage && !hasPlayedInitialAnimation) {
      // Animate to default position after a short delay
      const timer = setTimeout(() => {
        setHasPlayedInitialAnimation(true); // Set flag AFTER timer starts
        
        const startTime = Date.now();
        const duration = 800; // 800ms animation
        const targetRotation = { x: 2, y: -25 };
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease-out cubic function for smooth deceleration
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          updateCanvasViewsState({
            rotation: {
              x: targetRotation.x * easeOut,
              y: targetRotation.y * easeOut,
            },
          });
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      }, 300); // Start animation after 300ms delay
      
      return () => clearTimeout(timer);
    }
  }, [state.uploadedImage, hasPlayedInitialAnimation, updateCanvasViewsState]);

  useEffect(function restoreArtworkFromSearch() {
    if (artworkDefinition && !hasRestoredFromStorage) {
      // Restore artwork state from storage
      const img = new Image();
      img.onload = () => {
        updateState({
          uploadedImage: img,
          imageDataUrl: artworkDefinition.originalImageDataUrl,
          mmPerPixel: artworkDefinition.mmPerPixel,
          imageCenterXy: artworkDefinition.imageCenterXy,
          sideProcessing: artworkDefinition.sideProcessing,
          canvasBackgroundColor: artworkDefinition.canvasBackgroundColor,
        });
        // Mark as restored to prevent re-running
        setHasRestoredFromStorage(true);
        // Reset animation flag to allow initial animation to play
        setHasPlayedInitialAnimation(false);
        
        // Remove artwork param from URL to prevent re-renders
        navigate({ to: '/studio', search: { artwork: undefined }, replace: true });
      };
      img.src = artworkDefinition.originalImageDataUrl;
    }
  }, [artworkDefinition, hasRestoredFromStorage, navigate, updateState]);

  // Auto-save metadata to OPFS whenever state changes (excluding image)
  useEffect(function autoSaveMetadataToOPFS() {
    if (state.uploadedImage && state.imageDataUrl && hasRestoredFromStorage) {
      const metadata = {
        mmPerPixel: state.mmPerPixel,
        imageCenterXy: state.imageCenterXy,
        sideProcessing: state.sideProcessing,
        canvasBackgroundColor: state.canvasBackgroundColor,
      };
      
      const timeoutId = setTimeout(() => {
        saveMetadataToStorage(metadata);
      }, 500); // Debounce 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    state.mmPerPixel,
    state.imageCenterXy,
    state.sideProcessing,
    state.canvasBackgroundColor,
    state.uploadedImage,
    state.imageDataUrl,
    hasRestoredFromStorage
  ]);

  return (
    <StudioContext.Provider
      value={{
        state,
        updateState: updateState,
        handleImageUpload,
        handleMmPerPixelChange,
        handlePositionChange,
        handleOrder,
        handleClearWork,
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
                resetButton={
                  state.uploadedImage && (
                    <Button
                      onClick={handleClearWork}
                      variant="outline"
                      size="lg"
                    >
                      초기화
                    </Button>
                  )
                }
              />
            </ToolModeProvider>
          </div>
        </div>
      </CanvasViewsContext.Provider>
    </StudioContext.Provider>
  );
}
