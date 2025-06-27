import { Button } from "@/components/ui/button";
import { useStudioContext } from "./index";
import { sideProcessingTypes } from "./types";

export function RightControlPanel() {
  const {
    state,
    updateState,
    handleImageUpload,
    handleMmPerPixelChange,
    handlePositionChange,
  } = useStudioContext();

  // Calculate DPI based on current image display size
  const calculateDPI = () => {
    if (!state.uploadedImage) {
      return null;
    }

    const img = state.uploadedImage;
    const mmPerPixel = state.mmPerPixel;

    // displaySize(mm) = imageSize(pixels) * mmPerPixel(mm/pixel)
    const displayWidthMm = img.width * mmPerPixel;
    const displayHeightMm = img.height * mmPerPixel;

    // Convert mm to inches (1 inch = 25.4 mm)
    const displayWidthInches = displayWidthMm / 25.4;
    const displayHeightInches = displayHeightMm / 25.4;

    // Calculate DPI
    const dpiX = img.width / displayWidthInches;
    const dpiY = img.height / displayHeightInches;


    return {
      dpiX: Math.round(dpiX),
      dpiY: Math.round(dpiY),
      displayWidthMm: displayWidthMm.toFixed(1),
      displayHeightMm: displayHeightMm.toFixed(1),
    };
  };

  const dpiInfo = calculateDPI();

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
          해상도: {Math.round(25.4 / state.mmPerPixel)} DPI
        </label>
        <input
          type="range"
          min="50"
          max="600"
          step="1"
          value={Math.round(25.4 / state.mmPerPixel)}
          onChange={(e) =>
            handleMmPerPixelChange(25.4 / parseFloat(e.target.value))
          }
          className="w-full"
        />
        {dpiInfo && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <div>
              표시 크기: {dpiInfo.displayWidthMm} × {dpiInfo.displayHeightMm} mm
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
              X: {state.imageCenterXy.x.toFixed(1)}mm
            </label>
            <input
              type="range"
              min="-50.8"
              max="50.8"
              step="0.1"
              value={state.imageCenterXy.x}
              onChange={(e) =>
                handlePositionChange({
                  ...state.imageCenterXy,
                  x: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">
              Y: {state.imageCenterXy.y.toFixed(1)}mm
            </label>
            <input
              type="range"
              min="-76.2"
              max="76.2"
              step="0.1"
              value={state.imageCenterXy.y}
              onChange={(e) =>
                handlePositionChange({
                  ...state.imageCenterXy,
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
