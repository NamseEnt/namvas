import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { LeftPreviewArea } from "./LeftPreviewArea";
import { type SideProcessing } from "./types";
import { createCrossTexture } from "./canvas-views/createCrossTexture";
import {
  ToolModeProvider,
  ModeSelector,
  ToolsArea,
  ViewAngleButtons,
  ImageFitButtons,
} from "./tools";
import { ResponsiveStudioLayout } from "./ResponsiveStudioLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { type ArtworkDefinition } from "@/types/artwork";
import {
  saveArtworkToStorage,
  saveTextureToStorage,
  clearStorage,
  saveImageToStorage,
  getImageFromStorage,
  saveMetadataToStorage,
  getMetadataFromStorage,
} from "@/utils/storageManager";
import { userApi } from "@/lib/api";
import { useState as reactUseState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  handleSaveToArtworks: (title: string) => Promise<void>;
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
  useSearch({ from: "/studio/" });

  // Track if we've already restored from storage
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);

  // Get artwork from storage (search params used only as a trigger)
  const [artworkDefinition, setArtworkDefinition] =
    useState<ArtworkDefinition>();

  useEffect(
    function loadArtworkFromStorage() {
      if (!hasRestoredFromStorage) {
        // Load image and metadata separately
        Promise.all([getImageFromStorage(), getMetadataFromStorage()]).then(
          ([imageDataUrl, metadata]) => {
            if (imageDataUrl && metadata) {
              setArtworkDefinition({
                originalImageDataUrl: imageDataUrl,
                ...metadata,
              });
            }
          }
        );
      }
    },
    [hasRestoredFromStorage]
  );

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
    if (
      !confirm("정말 초기화하시겠습니까? 현재 작업 내용이 모두 삭제됩니다.")
    ) {
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
      const textureDataUrl = canvas.toDataURL("image/png", 0.9);

      // Save texture to storage
      console.log("[DEBUG] Saving texture to OPFS...");
      await saveTextureToStorage(textureDataUrl);

      // Navigate to order page (just as a trigger, no data in URL)
      console.log("[DEBUG] Navigating to order page...");
      navigate({
        to: "/order",
        search: {
          fromStudio: "true",
        },
      });
    } catch (error) {
      console.error("Error creating artwork for order:", error);
    }
  }, [state, canvasTextureImg, loadCanvasTexture, navigate]);

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

    try {
      // First upload the original image to get S3 key
      const imageBlob = await fetch(state.imageDataUrl).then(r => r.blob());
      const uploadResponse = await userApi.getOriginalImageUploadUrl(imageBlob.size);
      
      // Upload image to S3
      await fetch(uploadResponse.uploadUrl, {
        method: 'PUT',
        body: imageBlob,
        headers: {
          'Content-Type': imageBlob.type,
        },
      });

      // Create thumbnail using the cross texture
      const crossTexture = createCrossTexture({
        uploadedImage: state.uploadedImage,
        mmPerPixel: state.mmPerPixel,
        imageCenterXy: state.imageCenterXy,
        sideProcessing: state.sideProcessing,
        canvasTextureImg: canvasTextureImg,
      });

      // Convert Three.js texture to data URL for thumbnail
      const canvas = crossTexture.image as HTMLCanvasElement;
      const thumbnailDataUrl = canvas.toDataURL("image/png", 0.9);
      
      // Upload thumbnail to S3
      const thumbnailBlob = await fetch(thumbnailDataUrl).then(r => r.blob());
      const thumbnailUploadResponse = await userApi.getOriginalImageUploadUrl(thumbnailBlob.size);
      
      await fetch(thumbnailUploadResponse.uploadUrl, {
        method: 'PUT',
        body: thumbnailBlob,
        headers: {
          'Content-Type': thumbnailBlob.type,
        },
      });

      // Save artwork to database
      await userApi.saveArtwork({
        title,
        artwork: {
          originalImageS3Key: uploadResponse.imageId,
          mmPerPixel: state.mmPerPixel,
          imageCenterXy: state.imageCenterXy,
          sideProcessing: state.sideProcessing,
          canvasBackgroundColor: state.canvasBackgroundColor,
        },
        thumbnailS3Key: thumbnailUploadResponse.imageId,
      });

    } catch (error) {
      console.error("Error saving artwork:", error);
      throw error;
    }
  }, [state, canvasTextureImg, loadCanvasTexture]);

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

  useEffect(
    function restoreArtworkFromSearch() {
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
          navigate({
            to: "/studio",
            search: { artwork: undefined },
            replace: true,
          });
        };
        img.src = artworkDefinition.originalImageDataUrl;
      }
    },
    [artworkDefinition, hasRestoredFromStorage, navigate, updateState]
  );

  // Auto-save metadata to OPFS whenever state changes (excluding image)
  useEffect(
    function autoSaveMetadataToOPFS() {
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
    },
    [
      state.mmPerPixel,
      state.imageCenterXy,
      state.sideProcessing,
      state.canvasBackgroundColor,
      state.uploadedImage,
      state.imageDataUrl,
      hasRestoredFromStorage,
    ]
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
  const { state, handleOrder, handleSaveToArtworks } = useStudioContext();
  const [saveDialogOpen, setSaveDialogOpen] = reactUseState(false);
  const [artworkTitle, setArtworkTitle] = reactUseState("");
  const [isSaving, setIsSaving] = reactUseState(false);

  const handleSaveClick = async () => {
    if (!artworkTitle.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      await handleSaveToArtworks(artworkTitle.trim());
      setSaveDialogOpen(false);
      setArtworkTitle("");
      // Show success message or redirect to artworks page
    } catch (error) {
      console.error("Failed to save artwork:", error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={!state.uploadedImage}
            variant="outline"
            size="lg"
            className="px-6"
          >
            내 작품에 저장
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작품 저장하기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">작품 제목</Label>
              <Input
                id="title"
                value={artworkTitle}
                onChange={(e) => setArtworkTitle(e.target.value)}
                placeholder="작품 제목을 입력하세요"
                disabled={isSaving}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                disabled={isSaving}
              >
                취소
              </Button>
              <Button
                onClick={handleSaveClick}
                disabled={!artworkTitle.trim() || isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button
        onClick={handleOrder}
        disabled={!state.uploadedImage}
        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6"
        size="lg"
      >
        주문하기
      </Button>
    </div>
  );
}
