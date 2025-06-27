import { useStudioContext } from "..";

export function ImagePositionTool() {
  const { state, handlePositionChange } = useStudioContext();

  if (!state.uploadedImage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">위치 조절</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
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
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
}