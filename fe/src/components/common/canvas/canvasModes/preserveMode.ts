import * as THREE from "three";
import type { UVBounds } from "./common";
import { pixelToUV } from "./common";

// 살리기 모드 전용: 전개도를 이미지에 object-fit: cover로 맞추기
export function calculatePreserveModeTargetFit({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  sideThicknessM: number;
}) {
  // 전개도 크기 (미터)
  const unfoldedWidthM = 2 * sideThicknessM + canvasWidthM;   // 0.112
  const unfoldedHeightM = 2 * sideThicknessM + canvasHeightM; // 0.162
  
  // 전개도와 이미지의 비율
  const unfoldedAspect = unfoldedWidthM / unfoldedHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  
  // object-fit: cover - 한 축은 이미지와 동일, 다른 축은 비율에 맞춤
  let unfoldedWidthPx: number;
  let unfoldedHeightPx: number;
  let panAxis: 'horizontal' | 'vertical' | 'none';
  
  if (imageAspect > unfoldedAspect) {
    // 이미지가 더 가로형 → 전개도 높이를 이미지에 맞춤
    unfoldedHeightPx = imageHeightPx;
    unfoldedWidthPx = imageHeightPx * unfoldedAspect;
    panAxis = 'horizontal';
  } else if (imageAspect < unfoldedAspect) {
    // 이미지가 더 세로형 → 전개도 너비를 이미지에 맞춤
    unfoldedWidthPx = imageWidthPx;
    unfoldedHeightPx = imageWidthPx / unfoldedAspect;
    panAxis = 'vertical';
  } else {
    // 비율이 정확히 같음
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
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
  panPercent,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  sideThicknessM: number;
  panPercent: number;
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

// 살리기 모드 전용: 픽셀 좌표를 UV 좌표로 변환 (모든 면 필수)
export function convertPreserveModePixelToUV({
  faceRects,
  imageWidthPx,
  imageHeightPx,
  flipY = false,
}: {
  faceRects: ReturnType<typeof calculatePreserveModeFaceRects>;
  imageWidthPx: number;
  imageHeightPx: number;
  flipY?: boolean;
}) {
  return {
    front: pixelToUV({ rect: faceRects.front, imageWidthPx, imageHeightPx, flipY }),
    left: pixelToUV({ rect: faceRects.left, imageWidthPx, imageHeightPx, flipY }),
    right: pixelToUV({ rect: faceRects.right, imageWidthPx, imageHeightPx, flipY }),
    top: pixelToUV({ rect: faceRects.top, imageWidthPx, imageHeightPx, flipY }),
    bottom: pixelToUV({ rect: faceRects.bottom, imageWidthPx, imageHeightPx, flipY }),
  };
}

// 살리기 모드 전용: UV를 Geometry에 적용
export function applyPreserveModeUVToGeometry(
  geometry: THREE.PlaneGeometry,
  uvBounds: UVBounds
) {
  // PlaneGeometry의 올바른 정점 순서에 따른 UV 매핑
  // Vertex 0: 좌상, Vertex 1: 우상, Vertex 2: 좌하, Vertex 3: 우하
  const uvs = new Float32Array([
    uvBounds.uMin, uvBounds.vMax,  // Vertex 0: 좌상
    uvBounds.uMax, uvBounds.vMax,  // Vertex 1: 우상
    uvBounds.uMin, uvBounds.vMin,  // Vertex 2: 좌하
    uvBounds.uMax, uvBounds.vMin,  // Vertex 3: 우하
  ]);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

// 살리기 모드 통합 함수
export function createPreserveModeGeometries({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
  panPercent,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  sideThicknessM: number;
  panPercent: number;
}) {
  // Step 1: 각 면의 픽셀 좌표 계산
  const faceRects = calculatePreserveModeFaceRects({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    sideThicknessM,
    panPercent,
  });
  
  // Step 2: 픽셀 좌표를 UV로 변환
  const uvCoords = convertPreserveModePixelToUV({
    faceRects,
    imageWidthPx,
    imageHeightPx,
  });
  
  
  // Step 3: 각 면의 geometry 생성 및 UV 적용
  const geometries = {
    front: new THREE.PlaneGeometry(canvasWidthM, canvasHeightM),
    left: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    right: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    top: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
    bottom: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
  };
  
  // UV 적용 (모든 면 필수)
  applyPreserveModeUVToGeometry(geometries.front, uvCoords.front);
  applyPreserveModeUVToGeometry(geometries.left, uvCoords.left);
  applyPreserveModeUVToGeometry(geometries.right, uvCoords.right);
  applyPreserveModeUVToGeometry(geometries.top, uvCoords.top);
  applyPreserveModeUVToGeometry(geometries.bottom, uvCoords.bottom);
  
  return geometries;
}