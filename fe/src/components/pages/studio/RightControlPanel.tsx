import { Button } from "@/components/ui/button";
import { useStudioContext } from "./StudioPage";
import { sideProcessingTypes } from "./types";

export function RightControlPanel() {
  const {
    state,
    updateState,
    handleImageUpload,
    handleDpiChange,
    handlePositionChange,
  } = useStudioContext();

  // Calculate display size based on current DPI
  const calculateDisplaySize = () => {
    if (!state.uploadedImage) {
      return null;
    }

    const img = state.uploadedImage;

    // displaySize(inches) = imageSize(pixels) / dpi
    const displayWidthInches = img.width / state.dpi;
    const displayHeightInches = img.height / state.dpi;

    return {
      displayWidthInches: displayWidthInches.toFixed(2),
      displayHeightInches: displayHeightInches.toFixed(2),
    };
  };

  const displayInfo = calculateDisplaySize();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-lg font-semibold mb-6">편집 도구</h2>

      {/* 이미지 업로드 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">이미지 업로드</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
      </div>

      {/* 크기 조절 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          해상도: {Math.round(state.dpi)} DPI
        </label>
        <input
          type="range"
          min="50"
          max="600"
          step="1"
          value={Math.round(state.dpi)}
          onChange={(e) => handleDpiChange(parseFloat(e.target.value))}
          className="w-full"
        />
        {displayInfo && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <div>
              표시 크기: {displayInfo.displayWidthInches}" ×{" "}
              {displayInfo.displayHeightInches}"
            </div>
          </div>
        )}
      </div>

      {/* 위치 조절 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">위치 조절</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">
              X: {state.imageCenterXyInch.x.toFixed(2)}"
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={state.imageCenterXyInch.x}
              onChange={(e) =>
                handlePositionChange({
                  ...state.imageCenterXyInch,
                  x: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">
              Y: {state.imageCenterXyInch.y.toFixed(2)}"
            </label>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.01"
              value={state.imageCenterXyInch.y}
              onChange={(e) =>
                handlePositionChange({
                  ...state.imageCenterXyInch,
                  y: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 사이드 처리 */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">사이드 처리</label>
        <div className="grid grid-cols-3 gap-2">
          {sideProcessingTypes.map((type) => (
            <Button
              key={type}
              variant={
                state.sideProcessing.type === type ? "default" : "outline"
              }
              size="sm"
              onClick={() =>
                updateState({
                  sideProcessing:
                    type === "color"
                      ? { type: "color", color: "#ffffff" }
                      : { type: type },
                })
              }
            >
              {(() => {
                switch (type) {
                  case "none":
                    return "없음";
                  case "clip":
                    return "자르기";
                  case "color":
                    return "단색";
                  case "flip":
                    return "뒤집기";
                }
              })()}
            </Button>
          ))}
        </div>
        {state.sideProcessing.type === "color" && (
          <input
            type="color"
            value={state.sideProcessing.color}
            onChange={(e) =>
              updateState({
                sideProcessing: {
                  type: "color",
                  color: e.target.value,
                },
              })
            }
            className="w-full mt-2 h-10 rounded border border-border"
          />
        )}
      </div>
    </div>
  );
}
