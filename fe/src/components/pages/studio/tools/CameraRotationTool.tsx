import { useCanvasViewsContext } from "../StudioPage";
import { CAMERA_ROTATION_LIMITS } from "../types";

export function CameraRotationTool() {
  const { state, updateState } = useCanvasViewsContext();

  const handleYawChange = (value: number) => {
    updateState({
      rotation: {
        ...state.rotation,
        y: value,
      },
    });
  };

  const handlePitchChange = (value: number) => {
    updateState({
      rotation: {
        ...state.rotation,
        x: value,
      },
    });
  };

  const resetRotation = () => {
    updateState({
      rotation: { x: 0, y: 0 },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          수평 회전 (Yaw): {state.rotation.y.toFixed(1)}°
        </label>
        <input
          type="range"
          min={-CAMERA_ROTATION_LIMITS.maxYRotation * 1.5}
          max={CAMERA_ROTATION_LIMITS.maxYRotation * 1.5}
          step={0.5}
          value={state.rotation.y}
          onChange={(e) => handleYawChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{-CAMERA_ROTATION_LIMITS.maxYRotation * 1.5}°</span>
          <span>{CAMERA_ROTATION_LIMITS.maxYRotation * 1.5}°</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          수직 회전 (Pitch): {state.rotation.x.toFixed(1)}°
        </label>
        <input
          type="range"
          min={-CAMERA_ROTATION_LIMITS.maxXRotation * 1.2}
          max={CAMERA_ROTATION_LIMITS.maxXRotation * 1.2}
          step={0.5}
          value={state.rotation.x}
          onChange={(e) => handlePitchChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{-CAMERA_ROTATION_LIMITS.maxXRotation * 1.2}°</span>
          <span>{CAMERA_ROTATION_LIMITS.maxXRotation * 1.2}°</span>
        </div>
      </div>

      <button
        onClick={resetRotation}
        className="w-full px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 transition-colors"
      >
        정면으로 초기화
      </button>
    </div>
  );
}
