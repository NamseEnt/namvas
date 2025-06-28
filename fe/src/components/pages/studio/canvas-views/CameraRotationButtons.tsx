import { useCanvasViewsContext } from "..";
import { CAMERA_ROTATION_LIMITS } from "../types";
import { useRef } from "react";

export function CameraRotationButtons() {
  const { state, updateState } = useCanvasViewsContext();
  const animationRef = useRef<number | null>(null);

  const rotationStep = 15;

  const animateRotation = (targetX: number, targetY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startX = state.rotation.x;
    const startY = state.rotation.y;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const duration = 200; // 200ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic 함수로 부드러운 애니메이션
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startX + deltaX * easeProgress;
      const currentY = startY + deltaY * easeProgress;

      updateState({
        rotation: {
          x: currentX,
          y: currentY,
        },
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleRotation = (deltaX: number, deltaY: number) => {
    const newRotationX = Math.max(
      -CAMERA_ROTATION_LIMITS.maxXRotation * 1.2,
      Math.min(
        CAMERA_ROTATION_LIMITS.maxXRotation * 1.2,
        state.rotation.x + deltaY
      )
    );

    const newRotationY = Math.max(
      -CAMERA_ROTATION_LIMITS.maxYRotation * 1.5,
      Math.min(
        CAMERA_ROTATION_LIMITS.maxYRotation * 1.5,
        state.rotation.y + deltaX
      )
    );

    animateRotation(newRotationX, newRotationY);
  };

  const resetRotation = () => {
    animateRotation(0, 0);
  };

  return (
    <>
      {/* 왼쪽으로 돌리기 버튼 */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <button
            onClick={() => handleRotation(-rotationStep, 0)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="왼쪽으로 돌리기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 12l8-8v6h8v4h-8v6l-8-8z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 오른쪽으로 돌리기 버튼 */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <button
            onClick={() => handleRotation(rotationStep, 0)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="오른쪽으로 돌리기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 12l-8 8v-6H4v-4h8V4l8 8z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 위로 돌리기 버튼 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <button
            onClick={() => handleRotation(0, -rotationStep)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="위로 돌리기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l8 8h-6v8h-4v-8H4l8-8z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 아래로 돌리기 버튼 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <button
            onClick={() => handleRotation(0, rotationStep)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="아래로 돌리기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 20l-8-8h6V4h4v8h6l-8 8z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 초기화 버튼 */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <button
            onClick={resetRotation}
            className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
            title="정면으로 초기화"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}