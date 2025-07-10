import { useStudioContext } from "../StudioPage";

export function ImageSizeTool() {
  const { state, handleDpiChange } = useStudioContext();

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

  if (!state.uploadedImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        해상도: {Math.round(state.dpi)} DPI
      </h4>
      <div>
        <input
          type="range"
          min="50"
          max="600"
          step="1"
          value={Math.round(state.dpi)}
          onChange={(e) => handleDpiChange(parseFloat(e.target.value))}
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
