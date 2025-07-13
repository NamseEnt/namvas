import * as THREE from "three";
import type { UVBounds } from "./common";
import { pixelToUV, offsetToPanPercent } from "./common";

// 뒤집기 모드 전용: 각 면에 미러링된 UV 계산
export function calculateFlipModeUVs({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
  imageOffset,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  sideThicknessM: number;
  imageOffset: { x: number; y: number };
}) {
  // 먼저 기본 정면 UV 계산 (자르기 모드와 동일한 방식)
  const panPercentX = offsetToPanPercent(imageOffset.x);
  const panPercentY = offsetToPanPercent(imageOffset.y);
  
  // 이미지와 캔버스 비율에 따라 적절한 pan 축 선택
  const canvasAspect = canvasWidthM / canvasHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  const panPercent = imageAspect > canvasAspect ? panPercentX : panPercentY;
  
  // 정면의 픽셀 좌표 계산
  const frontRect = calculateFlipModeFrontRect({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    panPercent,
  });
  
  // UV로 변환
  const frontUV = pixelToUV({
    rect: frontRect,
    imageWidthPx,
    imageHeightPx,
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
      flipX: true, // X축 뒤집기 표시
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
      flipY: true, // Y축 뒤집기 표시
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

// 뒤집기 모드 전용: 캔버스 정면을 이미지에 맞추기 (자르기와 동일)
function calculateFlipModeFrontRect({
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
  // 캔버스와 이미지의 비율
  const canvasAspect = canvasWidthM / canvasHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  
  // object-fit: cover
  let canvasWidthPx: number;
  let canvasHeightPx: number;
  let panAxis: 'horizontal' | 'vertical' | 'none';
  
  if (imageAspect > canvasAspect) {
    canvasHeightPx = imageHeightPx;
    canvasWidthPx = imageHeightPx * canvasAspect;
    panAxis = 'horizontal';
  } else if (imageAspect < canvasAspect) {
    canvasWidthPx = imageWidthPx;
    canvasHeightPx = imageWidthPx / canvasAspect;
    panAxis = 'vertical';
  } else {
    canvasWidthPx = imageWidthPx;
    canvasHeightPx = imageHeightPx;
    panAxis = 'none';
  }
  
  // panning 적용
  let canvasX: number;
  let canvasY: number;
  
  if (panAxis === 'horizontal') {
    const panRangePx = Math.max(0, imageWidthPx - canvasWidthPx);
    canvasX = (panRangePx * panPercent) / 100;
    canvasY = 0;
  } else if (panAxis === 'vertical') {
    const panRangePx = Math.max(0, imageHeightPx - canvasHeightPx);
    canvasX = 0;
    canvasY = (panRangePx * panPercent) / 100;
  } else {
    canvasX = 0;
    canvasY = 0;
  }
  
  return {
    x: canvasX,
    y: canvasY,
    width: canvasWidthPx,
    height: canvasHeightPx,
  };
}


// 뒤집기 모드 전용: 미러링이 필요한 UV에 뒤집기 적용
export function applyFlipModeUVToGeometry(
  geometry: THREE.PlaneGeometry,
  uvBounds: UVBounds & { flipX?: boolean; flipY?: boolean }
) {
  const { uMin, uMax, vMin, vMax, flipX, flipY } = uvBounds;
  
  let uvs: Float32Array;
  
  // PlaneGeometry의 정점 순서: Vertex 0=좌상, 1=우상, 2=좌하, 3=우하
  if (flipX && !flipY) {
    // X축 뒤집기 (좌우 바뀜)
    uvs = new Float32Array([
      uMax, vMax,  // Vertex 0 (좌상) → 우상 UV
      uMin, vMax,  // Vertex 1 (우상) → 좌상 UV
      uMax, vMin,  // Vertex 2 (좌하) → 우하 UV
      uMin, vMin,  // Vertex 3 (우하) → 좌하 UV
    ]);
  } else if (!flipX && flipY) {
    // Y축 뒤집기 (상하 바뀜)
    uvs = new Float32Array([
      uMin, vMin,  // Vertex 0 (좌상) → 좌하 UV
      uMax, vMin,  // Vertex 1 (우상) → 우하 UV
      uMin, vMax,  // Vertex 2 (좌하) → 좌상 UV
      uMax, vMax,  // Vertex 3 (우하) → 우상 UV
    ]);
  } else {
    // 뒤집기 없음 (기본)
    uvs = new Float32Array([
      uMin, vMax,  // Vertex 0 (좌상)
      uMax, vMax,  // Vertex 1 (우상)
      uMin, vMin,  // Vertex 2 (좌하)
      uMax, vMin,  // Vertex 3 (우하)
    ]);
  }
  
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

// 뒤집기 모드 통합 함수
export function createFlipModeGeometries({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
  imageOffset,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  sideThicknessM: number;
  imageOffset: { x: number; y: number };
}) {
  // 모든 면의 UV 계산
  const uvs = calculateFlipModeUVs({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    sideThicknessM,
    imageOffset,
  });
  
  // 각 면의 geometry 생성
  const geometries = {
    front: new THREE.PlaneGeometry(canvasWidthM, canvasHeightM),
    left: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    right: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    top: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
    bottom: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
  };
  
  // UV 적용
  if (uvs.front) {
    // PlaneGeometry의 올바른 정점 순서에 따른 UV 매핑
    // Vertex 0: 좌상, Vertex 1: 우상, Vertex 2: 좌하, Vertex 3: 우하
    const frontUVs = new Float32Array([
      uvs.front.uMin, uvs.front.vMax,  // Vertex 0: 좌상
      uvs.front.uMax, uvs.front.vMax,  // Vertex 1: 우상
      uvs.front.uMin, uvs.front.vMin,  // Vertex 2: 좌하
      uvs.front.uMax, uvs.front.vMin,  // Vertex 3: 우하
    ]);
    geometries.front.setAttribute('uv', new THREE.BufferAttribute(frontUVs, 2));
  }
  
  // 옆면들은 뒤집기 적용
  if (uvs.left) applyFlipModeUVToGeometry(geometries.left, uvs.left);
  if (uvs.right) applyFlipModeUVToGeometry(geometries.right, uvs.right);
  if (uvs.top) applyFlipModeUVToGeometry(geometries.top, uvs.top);
  if (uvs.bottom) applyFlipModeUVToGeometry(geometries.bottom, uvs.bottom);
  
  return geometries;
}