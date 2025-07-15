// UV calculation utilities for CanvasView
import { canvasProductSizeM } from "../constants";
import { SideMode, type UVBounds } from "../types";

// imageOffset (-1 ~ 1)을 panPercent (0 ~ 100)로 변환
// offset이 양수이면 이미지가 양의 방향으로 이동
export function offsetToPanPercent(offset: number): number {
  return (1 - offset) * 50;
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

// 자르기 모드 전용: 캔버스 정면을 이미지에 object-fit: cover로 맞추기
export function calculateClipModeTargetFit({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM?: number;
  canvasHeightM?: number;
}) {
  // 캔버스와 이미지의 비율
  const canvasAspect = canvasWidthM / canvasHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  
  // object-fit: cover - 한 축은 이미지와 동일, 다른 축은 비율에 맞춤
  let canvasWidthPx: number;
  let canvasHeightPx: number;
  let panAxis: 'horizontal' | 'vertical' | 'none';
  
  if (imageAspect > canvasAspect) {
    // 이미지가 더 가로형 → 캔버스 높이를 이미지에 맞춤
    canvasHeightPx = imageHeightPx;
    canvasWidthPx = imageHeightPx * canvasAspect;
    panAxis = 'horizontal';
  } else if (imageAspect < canvasAspect) {
    // 이미지가 더 세로형 → 캔버스 너비를 이미지에 맞춤
    canvasWidthPx = imageWidthPx;
    canvasHeightPx = imageWidthPx / canvasAspect;
    panAxis = 'vertical';
  } else {
    // 비율이 정확히 같음
    canvasWidthPx = imageWidthPx;
    canvasHeightPx = imageHeightPx;
    panAxis = 'none';
  }
  
  return {
    canvasWidthPx,
    canvasHeightPx,
    panAxis,
    panRangePx: {
      horizontal: Math.max(0, imageWidthPx - canvasWidthPx),
      vertical: Math.max(0, imageHeightPx - canvasHeightPx),
    }
  };
}

// 자르기 모드 전용: 정면의 픽셀 좌표 계산
export function calculateClipModeFrontRect({
  imageWidthPx,
  imageHeightPx,
  panPercent,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  panPercent: number;
  canvasWidthM?: number;
  canvasHeightM?: number;
}) {
  // Step 1: 캔버스 정면을 이미지에 object-fit: cover로 맞추기
  const canvasOnImage = calculateClipModeTargetFit({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
  });
  
  // Step 2: panning 적용하여 캔버스 위치 계산
  let canvasX: number;
  let canvasY: number;
  
  if (canvasOnImage.panAxis === 'horizontal') {
    canvasX = (canvasOnImage.panRangePx.horizontal * panPercent) / 100;
    canvasY = 0;
  } else if (canvasOnImage.panAxis === 'vertical') {
    canvasX = 0;
    canvasY = (canvasOnImage.panRangePx.vertical * panPercent) / 100;
  } else {
    canvasX = 0;
    canvasY = 0;
  }
  
  // Step 3: 정면의 픽셀 좌표 반환
  return {
    x: canvasX,
    y: canvasY,
    width: canvasOnImage.canvasWidthPx,
    height: canvasOnImage.canvasHeightPx,
  };
}

// 자르기 모드 UV 계산
export function calculateClipModeUV({
  imageWidthPx,
  imageHeightPx,
  imageOffset,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  imageOffset: { x: number; y: number };
  canvasWidthM?: number;
  canvasHeightM?: number;
}): UVBounds {
  // imageOffset를 panPercent로 변환
  const panPercentX = offsetToPanPercent(imageOffset.x);
  const panPercentY = offsetToPanPercent(imageOffset.y);
  
  // 이미지와 캔버스 비율에 따라 적절한 pan 축 선택
  const canvasAspect = canvasWidthM / canvasHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  const panPercent = imageAspect > canvasAspect ? panPercentX : panPercentY;
  
  const frontRect = calculateClipModeFrontRect({
    imageWidthPx,
    imageHeightPx,
    panPercent,
    canvasWidthM,
    canvasHeightM,
  });
  
  return pixelToUV({
    rect: frontRect,
    imageWidthPx,
    imageHeightPx,
  });
}

// 살리기 모드 전용: 전개도를 이미지에 object-fit: cover로 맞추기
export function calculatePreserveModeTargetFit({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
  sideThicknessM = canvasProductSizeM.thicknessM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM?: number;
  canvasHeightM?: number;
  sideThicknessM?: number;
}) {
  // 전개도 크기 (미터)
  const unfoldedWidthM = 2 * sideThicknessM + canvasWidthM;
  const unfoldedHeightM = 2 * sideThicknessM + canvasHeightM;
  
  // 전개도와 이미지의 비율
  const unfoldedAspect = unfoldedWidthM / unfoldedHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  
  // object-fit: cover
  let unfoldedWidthPx: number;
  let unfoldedHeightPx: number;
  let panAxis: 'horizontal' | 'vertical' | 'none';
  
  if (imageAspect > unfoldedAspect) {
    unfoldedHeightPx = imageHeightPx;
    unfoldedWidthPx = imageHeightPx * unfoldedAspect;
    panAxis = 'horizontal';
  } else if (imageAspect < unfoldedAspect) {
    unfoldedWidthPx = imageWidthPx;
    unfoldedHeightPx = imageWidthPx / unfoldedAspect;
    panAxis = 'vertical';
  } else {
    unfoldedWidthPx = imageWidthPx;
    unfoldedHeightPx = imageHeightPx;
    panAxis = 'none';
  }
  
  return {
    unfoldedWidthPx,
    unfoldedHeightPx,
    panAxis,
    panRangePx: {
      horizontal: Math.max(0, imageWidthPx - unfoldedWidthPx),
      vertical: Math.max(0, imageHeightPx - unfoldedHeightPx),
    }
  };
}

// 살리기 모드 전용: 각 면의 픽셀 좌표 계산
export function calculatePreserveModeFaceRects({
  imageWidthPx,
  imageHeightPx,
  panPercent,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
  sideThicknessM = canvasProductSizeM.thicknessM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  panPercent: number;
  canvasWidthM?: number;
  canvasHeightM?: number;
  sideThicknessM?: number;
}) {
  // Step 1: 전개도 크기 계산
  const unfoldedCanvas = calculatePreserveModeTargetFit({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    sideThicknessM,
  });
  
  // Step 2: panning 적용하여 전개도 위치 계산
  let unfoldedX: number;
  let unfoldedY: number;
  
  if (unfoldedCanvas.panAxis === 'horizontal') {
    unfoldedX = (unfoldedCanvas.panRangePx.horizontal * panPercent) / 100;
    unfoldedY = 0;
  } else if (unfoldedCanvas.panAxis === 'vertical') {
    unfoldedX = 0;
    unfoldedY = (unfoldedCanvas.panRangePx.vertical * panPercent) / 100;
  } else {
    unfoldedX = 0;
    unfoldedY = 0;
  }
  
  // Step 3: 각 면의 비율 계산
  const sideRatio = sideThicknessM / (2 * sideThicknessM + canvasWidthM);
  const frontRatio = canvasWidthM / (2 * sideThicknessM + canvasWidthM);
  const verticalSideRatio = sideThicknessM / (2 * sideThicknessM + canvasHeightM);
  const verticalFrontRatio = canvasHeightM / (2 * sideThicknessM + canvasHeightM);
  
  // Step 4: 각 면의 픽셀 좌표 계산
  const sideWidthPx = unfoldedCanvas.unfoldedWidthPx * sideRatio;
  const frontWidthPx = unfoldedCanvas.unfoldedWidthPx * frontRatio;
  const sideHeightPx = unfoldedCanvas.unfoldedHeightPx * verticalSideRatio;
  const frontHeightPx = unfoldedCanvas.unfoldedHeightPx * verticalFrontRatio;
  
  return {
    front: {
      x: unfoldedX + sideWidthPx,
      y: unfoldedY + sideHeightPx,
      width: frontWidthPx,
      height: frontHeightPx,
    },
    left: {
      x: unfoldedX,
      y: unfoldedY + sideHeightPx,
      width: sideWidthPx,
      height: frontHeightPx,
    },
    right: {
      x: unfoldedX + sideWidthPx + frontWidthPx,
      y: unfoldedY + sideHeightPx,
      width: sideWidthPx,
      height: frontHeightPx,
    },
    top: {
      x: unfoldedX + sideWidthPx,
      y: unfoldedY + sideHeightPx + frontHeightPx,
      width: frontWidthPx,
      height: sideHeightPx,
    },
    bottom: {
      x: unfoldedX + sideWidthPx,
      y: unfoldedY,
      width: frontWidthPx,
      height: sideHeightPx,
    },
  };
}

// 살리기 모드 UV 계산
export function calculatePreserveModeUV({
  imageWidthPx,
  imageHeightPx,
  imageOffset,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
  sideThicknessM = canvasProductSizeM.thicknessM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  imageOffset: { x: number; y: number };
  canvasWidthM?: number;
  canvasHeightM?: number;
  sideThicknessM?: number;
}) {
  // imageOffset를 panPercent로 변환
  const panPercentX = offsetToPanPercent(imageOffset.x);
  const panPercentY = offsetToPanPercent(imageOffset.y);
  
  // 이미지와 전개도 비율에 따라 적절한 pan 축 선택
  const unfoldedWidthM = 2 * sideThicknessM + canvasWidthM;
  const unfoldedHeightM = 2 * sideThicknessM + canvasHeightM;
  const unfoldedAspect = unfoldedWidthM / unfoldedHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  const panPercent = imageAspect > unfoldedAspect ? panPercentX : panPercentY;
  
  const faceRects = calculatePreserveModeFaceRects({
    imageWidthPx,
    imageHeightPx,
    panPercent,
    canvasWidthM,
    canvasHeightM,
    sideThicknessM,
  });
  
  return {
    front: pixelToUV({ rect: faceRects.front, imageWidthPx, imageHeightPx }),
    left: pixelToUV({ rect: faceRects.left, imageWidthPx, imageHeightPx }),
    right: pixelToUV({ rect: faceRects.right, imageWidthPx, imageHeightPx }),
    top: pixelToUV({ rect: faceRects.top, imageWidthPx, imageHeightPx }),
    bottom: pixelToUV({ rect: faceRects.bottom, imageWidthPx, imageHeightPx }),
  };
}

// 뒤집기 모드 UV 계산
export function calculateFlipModeUV({
  imageWidthPx,
  imageHeightPx,
  imageOffset,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
  sideThicknessM = canvasProductSizeM.thicknessM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  imageOffset: { x: number; y: number };
  canvasWidthM?: number;
  canvasHeightM?: number;
  sideThicknessM?: number;
}) {
  // 먼저 기본 정면 UV 계산 (자르기 모드와 동일한 방식)
  const frontUV = calculateClipModeUV({
    imageWidthPx,
    imageHeightPx,
    imageOffset,
    canvasWidthM,
    canvasHeightM,
  });
  
  const { uMin: uvLeft, uMax: uvRight, vMin: uvBottom, vMax: uvTop } = frontUV;
  
  // 옆면 두께와 캔버스 크기를 고려한 스케일 계산
  const horizontalScale = sideThicknessM / canvasWidthM;
  const verticalScale = sideThicknessM / canvasHeightM;
  
  return {
    front: frontUV,
    // 왼쪽면: 정면의 왼쪽 가장자리부터 시작해서 왼쪽으로 뒤집기
    left: {
      uMin: Math.max(0, uvLeft),
      uMax: Math.min(1, uvLeft + (uvRight - uvLeft) * horizontalScale),
      vMin: uvBottom,
      vMax: uvTop,
      flipX: true,
    },
    // 오른쪽면: 정면의 오른쪽 가장자리부터 시작해서 오른쪽으로 뒤집기
    right: {
      uMin: Math.max(0, uvRight - (uvRight - uvLeft) * horizontalScale),
      uMax: Math.min(1, uvRight),
      vMin: uvBottom,
      vMax: uvTop,
      flipX: true,
    },
    // 상단면: 정면의 상단 가장자리부터 시작해서 위로 뒤집기
    top: {
      uMin: uvLeft,
      uMax: uvRight,
      vMin: Math.max(0, uvTop - (uvTop - uvBottom) * verticalScale),
      vMax: Math.min(1, uvTop),
      flipY: true,
    },
    // 하단면: 정면의 하단 가장자리부터 시작해서 아래로 뒤집기
    bottom: {
      uMin: uvLeft,
      uMax: uvRight,
      vMin: Math.max(0, uvBottom),
      vMax: Math.min(1, uvBottom + (uvTop - uvBottom) * verticalScale),
      flipY: true,
    },
  };
}

// 통합 UV 계산 함수
export function calculateUvBounds({
  imageWh,
  imageOffset,
  sideMode,
  canvasWidthM = canvasProductSizeM.widthM,
  canvasHeightM = canvasProductSizeM.heightM,
  sideThicknessM = canvasProductSizeM.thicknessM,
}: {
  imageWh: { width: number; height: number };
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
  canvasWidthM?: number;
  canvasHeightM?: number;
  sideThicknessM?: number;
}) {
  const params = {
    imageWidthPx: imageWh.width,
    imageHeightPx: imageWh.height,
    imageOffset,
    canvasWidthM,
    canvasHeightM,
    sideThicknessM,
  };
  
  switch (sideMode) {
    case SideMode.CLIP:
      return {
        front: calculateClipModeUV(params),
        left: null,
        right: null,
        top: null,
        bottom: null,
      };
    
    case SideMode.PRESERVE:
      return calculatePreserveModeUV(params);
    
    case SideMode.FLIP:
      return calculateFlipModeUV(params);
    
    default:
      throw new Error(`Unknown side mode: ${sideMode}`);
  }
}