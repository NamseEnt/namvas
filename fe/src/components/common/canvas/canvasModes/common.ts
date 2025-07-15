// 옆면 처리 모드
export enum SideMode {
  CLIP = "clip",     // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip"      // 뒤집기
}

// UV 좌표 범위 타입
export type UVBounds = {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
};

// imageOffset (-1 ~ 1)을 panPercent (0 ~ 100)로 변환
export function offsetToPanPercent(offset: number): number {
  return (offset + 1) * 50;
}

// 픽셀 좌표를 UV 좌표로 변환
export function pixelToUV({
  rect,
  imageWidthPx,
  imageHeightPx,
  flipY = false,
}: {
  rect: { x: number; y: number; width: number; height: number };
  imageWidthPx: number;
  imageHeightPx: number;
  flipY?: boolean;
}): UVBounds {
  const uMin = rect.x / imageWidthPx;
  const uMax = (rect.x + rect.width) / imageWidthPx;
  
  let vMin: number;
  let vMax: number;
  
  if (flipY) {
    // Y축 뒤집기 (Three.js 기본값)
    vMin = 1 - (rect.y + rect.height) / imageHeightPx;
    vMax = 1 - rect.y / imageHeightPx;
  } else {
    // Y축 유지
    vMin = rect.y / imageHeightPx;
    vMax = (rect.y + rect.height) / imageHeightPx;
  }
  
  return { uMin, uMax, vMin, vMax };
}