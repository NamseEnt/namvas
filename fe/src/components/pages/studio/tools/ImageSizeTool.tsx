import { useStudioContext } from "..";

export function ImageSizeTool() {
  const { state, handleMmPerPixelChange } = useStudioContext();

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

  if (!state.uploadedImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">
        해상도: {Math.round(25.4 / state.mmPerPixel)} DPI
      </h4>
      <div>
        <input
          type="range"
          min="50"
          max="600"
          step="1"
          value={Math.round(25.4 / state.mmPerPixel)}
          onChange={(e) =>
            handleMmPerPixelChange(25.4 / parseFloat(e.target.value))
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        {dpiInfo && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <div>
              표시 크기: {dpiInfo.displayWidthMm} × {dpiInfo.displayHeightMm} mm
            </div>
          </div>
        )}
      </div>
    </div>
  );
}