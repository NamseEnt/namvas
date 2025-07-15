import { Button } from "@/components/ui/button";
import { CanvasArea } from "./components/CanvasArea";
import { ControlsArea } from "./components/ControlsArea";
import { UploadArea } from "./components/UploadArea";
import { StudioContext } from "./StudioContext";
import { CanvasView } from "@/components/common/CanvasView";
import { useContext } from "react";

export default function StudioPage() {
  const { state, handleSave } = useContext(StudioContext);

  if (!state.uploadedImage) {
    return <UploadArea />;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row">
      <div className="flex-1 relative p-4 lg:p-0">
        <CanvasArea>
          <CanvasView
            imageSource={state.uploadedImage.dataUrl}
            rotation={state.rotation}
            sideMode={state.sideMode}
            imageOffset={state.imageOffset}
          />
        </CanvasArea>

        <div className="lg:hidden absolute top-6 right-6">
          <Button
            onClick={handleSave}
            disabled={state.isSaving}
            size="sm"
            className="h-10 px-4 text-xs shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            {state.isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      <ControlsArea />
    </div>
  );
}
