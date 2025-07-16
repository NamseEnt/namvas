import { canvasProductSizeM } from "../constants";

// 카메라 거리 계산
export function calculateCameraDistance(rotation: {
  x: number;
  y: number;
}): number {
  const canvasDiagonal = Math.sqrt(
    canvasProductSizeM.widthM ** 2 + canvasProductSizeM.heightM ** 2
  );
  const baseCameraDistance = canvasDiagonal * 1.5;
  const cameraDistanceMultiplier = canvasDiagonal * 0.003;
  return (
    baseCameraDistance +
    (Math.abs(rotation.y) + Math.abs(rotation.x)) * cameraDistanceMultiplier
  );
}
