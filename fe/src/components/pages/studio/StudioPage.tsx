import { Button } from "@/components/ui/button";
import { CanvasArea } from "./components/CanvasArea";
import { ControlsArea } from "./components/ControlsArea";
import { UploadArea } from "./components/UploadArea";
import { StudioContext } from "./StudioContext";
import { CanvasView } from "@/components/common/CanvasView";
import { useContext, useState } from "react";
import { StudioContextProvider } from "@/components/pages/studio/StudioContext";

export default function StudioPage() {
  const [file, setFile] = useState<File>();

  if (!file) {
    return <UploadArea onFile={setFile} />;
  }

  return (
    <StudioContextProvider
      imageState={{
        originalFile: file,
        textureFileState: { type: "converting" },
        isImageChanged: false,
      }}
    >
      <Inner />
    </StudioContextProvider>
  );
}

function Inner() {
  const { state, handleSave } = useContext(StudioContext);

  if (state.imageState.textureFileState.type === "converting") {
    return (
      <div className="h-[calc(100vh-56px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">PSD 파일을 변환하고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] bg-gray-50 flex flex-col lg:flex-row">
      <div className="flex-1 relative p-4 lg:p-0">
        <CanvasArea>
          <CanvasView
            imageSource={state.imageState.textureFileState.file}
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
