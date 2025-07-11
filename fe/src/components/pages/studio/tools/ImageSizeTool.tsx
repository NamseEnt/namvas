import { useStudioContext } from "../StudioPage";
import { useCallback, useState, useEffect } from "react";

export function ImageSizeTool() {
  const { state, handleDpiChange } = useStudioContext();
  
  // 로컬 상태로 슬라이더 즉시 업데이트 (대화형 UX)
  const [localDpi, setLocalDpi] = useState(state.dpi);
  
  // 컬텍스트 DPI 변경시 로컬 상태 동기화
  useEffect(() => {
    setLocalDpi(state.dpi);
  }, [state.dpi]);
  
  // 불필요한 throttleRef 제거
  // const throttleRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleDpiChangeThrottled = useCallback((dpi: number) => {
    setLocalDpi(dpi);
    handleDpiChange(dpi);
  }, [handleDpiChange]);

  // Calculate display size based on current DPI
  const calculateDisplaySize = () => {
    if (!state.uploadedImage) {
      return null;
    }

    const img = state.uploadedImage;

    // displaySize(inches) = imageSize(pixels) / dpi
    const displayWidthInches = img.width / localDpi;
    const displayHeightInches = img.height / localDpi;

    return {
      displayWidthInches: displayWidthInches.toFixed(2),
      displayHeightInches: displayHeightInches.toFixed(2),
    };
  };

  const displayInfo = calculateDisplaySize();

  if (!state.uploadedImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        해상도: {Math.round(localDpi)} DPI
      </h4>
      <div>
        <input
          type="range"
          min="50"
          max="600"
          step="1"
          value={Math.round(localDpi)}
          onChange={(e) => handleDpiChangeThrottled(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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
    </div>
  );
}
