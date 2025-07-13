import * as THREE from "three";

// 자르기 모드 전용: 캔버스 정면을 이미지에 object-fit: cover로 맞추기
export function calculateClipModeTargetFit({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
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
  canvasWidthM,
  canvasHeightM,
  panPercent,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  panPercent: number;
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

// 자르기 모드 전용: 픽셀 좌표를 UV 좌표로 변환 (정면만)
export function convertClipModePixelToUV({
  frontRect,
  imageWidthPx,
  imageHeightPx,
  flipY = false,
}: {
  frontRect: ReturnType<typeof calculateClipModeFrontRect>;
  imageWidthPx: number;
  imageHeightPx: number;
  flipY?: boolean;
}) {
  const uMin = frontRect.x / imageWidthPx;
  const uMax = (frontRect.x + frontRect.width) / imageWidthPx;
  
  let vMin: number;
  let vMax: number;
  
  if (flipY) {
    // Y축 뒤집기 (Three.js 기본값)
    vMin = 1 - (frontRect.y + frontRect.height) / imageHeightPx;
    vMax = 1 - frontRect.y / imageHeightPx;
  } else {
    // Y축 유지
    vMin = frontRect.y / imageHeightPx;
    vMax = (frontRect.y + frontRect.height) / imageHeightPx;
  }
  
  return { uMin, uMax, vMin, vMax };
}

// 자르기 모드 전용: UV를 Geometry에 적용
export function applyClipModeUVToGeometry(
  geometry: THREE.PlaneGeometry,
  uvBounds: { uMin: number; uMax: number; vMin: number; vMax: number }
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

// 자르기 모드 통합 함수
export function createClipModeGeometries({
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
  // Step 1: 정면의 픽셀 좌표 계산
  const frontRect = calculateClipModeFrontRect({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    panPercent,
  });
  
  // Step 2: 정면의 픽셀 좌표를 UV로 변환
  const frontUV = convertClipModePixelToUV({
    frontRect,
    imageWidthPx,
    imageHeightPx,
  });
  
  // Step 3: 각 면의 geometry 생성
  const geometries = {
    front: new THREE.PlaneGeometry(canvasWidthM, canvasHeightM),
    left: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    right: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    top: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
    bottom: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
  };
  
  // 정면에만 UV 적용 (이미지 텍스처)
  applyClipModeUVToGeometry(geometries.front, frontUV);
  
  // 옆면들은 UV 설정 없음 (캔버스 텍스처 사용)
  
  return geometries;
}