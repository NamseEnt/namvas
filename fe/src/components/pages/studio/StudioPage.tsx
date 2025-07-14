import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { useStudioLogic } from "./hooks/useStudioLogic";
import { CanvasArea } from "./components/CanvasArea";
import { ControlsArea } from "./components/ControlsArea";
import { UploadArea } from "./components/UploadArea";

// 기존 코드와의 호환성을 위한 context
const StudioContext = createContext<{
  state: {
    uploadedImage: HTMLImageElement | undefined;
    imageDataUrl: string | undefined;
    uploadedFileName?: string;
    sideMode: any;
    imageOffset: { x: number; y: number };
    rotation: { x: number; y: number };
  };
  updateState: (updates: any) => void;
  handleImageUpload: (file: File) => void;
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

// CanvasViews에서 사용할 context 추가 (기존 코드와의 호환성을 위해)
export const useCanvasViewsContext = useStudioContext;

export default function StudioPage() {
  const {
    state,
    isSaving,
    imageTexture,
    CAMERA_PRESETS,
    updateState,
    handleImageUpload,
    handleSave,
    canvasInteraction,
    dragAndDrop,
    cycleCameraPreset,
    imagePositionInfo,
    navigate,
  } = useStudioLogic();

  const handleSaveToArtworks = async (_title: string) => {
    if (!state.uploadedImage || !state.imageDataUrl) {
      throw new Error("이미지가 없습니다");
    }
    throw new Error("Not implemented");
  };

  // 기존 코드와의 호환성을 위한 Provider
  const contextValue = {
    state,
    updateState,
    handleImageUpload,
    handleSaveToArtworks,
    isSaving,
  };

  if (!state.uploadedImage) {
    return (
      <StudioContext.Provider value={contextValue}>
        <UploadArea
          onImageUpload={handleImageUpload}
          dragAndDrop={dragAndDrop}
          className="h-screen"
        />
      </StudioContext.Provider>
    );
  }

  return (
    <StudioContext.Provider value={contextValue}>
      <div className="h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* 캔버스 영역 */}
        <div className="flex-1 relative p-4 lg:p-0">
          <CanvasArea
            imageTexture={imageTexture}
            rotation={state.rotation}
            imageOffset={state.imageOffset}
            sideMode={state.sideMode}
            canvasInteraction={canvasInteraction}
            dragAndDrop={dragAndDrop}
            className="w-full h-full"
          />
          
          {/* 모바일 저장 버튼 */}
          <div className="lg:hidden absolute top-6 right-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="h-10 px-4 text-xs shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>

        {/* 컨트롤 영역 */}
        <ControlsArea
          state={state}
          CAMERA_PRESETS={CAMERA_PRESETS}
          updateState={updateState}
          handleImageUpload={handleImageUpload}
          handleSave={handleSave}
          cycleCameraPreset={cycleCameraPreset}
          imagePositionInfo={imagePositionInfo}
          navigate={navigate}
          isSaving={isSaving}
        />
      </div>
    </StudioContext.Provider>
  );
}

