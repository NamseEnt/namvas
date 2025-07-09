import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { LeftPreviewArea } from "./LeftPreviewArea";
import { type SideProcessing } from "./types";
import {
  ToolModeProvider,
  ModeSelector,
  ToolsArea,
  ViewAngleButtons,
  ImageFitButtons,
} from "./tools";
import { ResponsiveStudioLayout } from "./ResponsiveStudioLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useArtworks } from "@/hooks/useArtworks";
import { toast } from "sonner";

export type StudioState = {
  uploadedImage: HTMLImageElement | undefined;
  imageDataUrl: string | undefined;
  mmPerPixel: number; // millimeters per pixel ratio
  imageCenterXy: { x: number; y: number }; // in millimeters
  sideProcessing: SideProcessing;
  canvasBackgroundColor: string;
  uploadedFileName?: string; // 업로드된 파일의 원본 이름
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
  handleSaveToArtworks: (title: string) => Promise<void>;
  isSaving: boolean;
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
}>(null!);

export const useCanvasViewsContext = () => useContext(CanvasViewsContext);

export default function StudioPage() {
  const navigate = useNavigate();
  
  // 아트워크 관련 기능들
  const { saveArtwork, isSaving } = useArtworks();


  const [state, setState] = useState<StudioState>({
    uploadedImage: undefined,
    imageDataUrl: undefined,
    mmPerPixel: 1, // will be auto-calculated on image upload
    imageCenterXy: { x: 0, y: 0 }, // in millimeters
    sideProcessing: {
      type: "clip",
    },
    canvasBackgroundColor: "dark-pattern",
    uploadedFileName: undefined,
  });

  const [canvasViewsState, setCanvasViewsState] = useState<CanvasViewsState>({
    rotation: { x: 0, y: 0 }, // Start from front view for animation
  });

  // Track if initial animation has been played
  const [hasPlayedInitialAnimation, setHasPlayedInitialAnimation] =
    useState(false);

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

  const updateCanvasViewsState = useCallback(
    (updates: Partial<CanvasViewsState>) => {
      setCanvasViewsState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

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
            uploadedFileName: file.name, // 파일 이름 저장
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
    if (
      !confirm("정말 초기화하시겠습니까? 현재 작업 내용이 모두 삭제됩니다.")
    ) {
      return;
    }

    // Clear OPFS storage

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
      uploadedFileName: undefined,
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
      // Navigate to order page directly
      navigate({
        to: "/order",
        search: {
          fromStudio: "true",
          fromBuildOrder: undefined,
        },
      });
    } catch (error) {
      console.error("Error creating artwork for order:", error);
    }
  }, [navigate, state.imageDataUrl, state.uploadedImage, canvasTextureImg, loadCanvasTexture]);

  const handleSaveToArtworks = useCallback(async (title: string) => {
    if (!state.uploadedImage || !state.imageDataUrl) {
      throw new Error("No image to save");
    }

    // Ensure canvas texture is loaded
    if (!canvasTextureImg) {
      loadCanvasTexture();
      const img = new Image();
      img.onload = () => setCanvasTextureImg(img);
      img.src = "./canvas-texture.jpg";
      throw new Error("Canvas texture not loaded yet");
    }

    // 복잡한 API 호출 로직이 useArtworks 훅으로 캡슐화됨
    await saveArtwork({
      title,
      imageDataUrl: state.imageDataUrl,
      uploadedImage: state.uploadedImage,
      mmPerPixel: state.mmPerPixel,
      imageCenterXy: state.imageCenterXy,
      sideProcessing: state.sideProcessing,
      canvasTextureImg: canvasTextureImg,
    });
  }, [state, canvasTextureImg, loadCanvasTexture, saveArtwork]);

  useEffect(
    function preloadCanvasTexture() {
      loadCanvasTexture();
    },
    [loadCanvasTexture]
  );

  // Initial animation when image is uploaded
  useEffect(
    function animateInitialCameraPosition() {
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
    },
    [state.uploadedImage, hasPlayedInitialAnimation, updateCanvasViewsState]
  );



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
        handleSaveToArtworks,
        isSaving,
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
                  <ActionButtons />
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

function ActionButtons() {
  const { state, handleSaveToArtworks, isSaving } = useStudioContext();
  const navigate = useNavigate();

  const handleGoToArtworks = () => {
    navigate({ to: "/artworks" });
  };

  const handleSaveWithFileName = async () => {
    if (!state.uploadedFileName) {
      return;
    }

    // 파일 이름에서 확장자 제거하여 작품 제목으로 사용
    const fileName = state.uploadedFileName;
    const title = fileName.replace(/\.[^/.]+$/, ""); // 확장자 제거

    try {
      console.log("Starting to save artwork...");
      await handleSaveToArtworks(title);
      console.log("Artwork saved successfully!");
      toast.success("작품이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save artwork in Studio:", error);
      toast.error("작품 저장에 실패했습니다.");
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleGoToArtworks}
        variant="outline"
        size="lg"
        className="px-6"
      >
        내 작품으로 가기
      </Button>
      
      <Button
        onClick={handleSaveWithFileName}
        disabled={!state.uploadedImage || !state.uploadedFileName}
        size="lg"
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 w-32"
      >
        {isSaving ? "저장 중..." : "저장하기"}
      </Button>
    </div>
  );
}
