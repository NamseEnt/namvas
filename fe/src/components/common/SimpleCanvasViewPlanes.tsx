import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 옆면 처리 모드
enum SideMode {
  CLIP = "clip",     // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip"      // 뒤집기
}

// 타겟을 이미지에 object-fit: cover로 맞추기
// 타겟(target): 이미지 위에 배치할 대상 - 전개도, 캔버스 정면 등
export function calculateTargetFitCover({
  targetWidthM,
  targetHeightM,
  imageWidthPx,
  imageHeightPx,
}: {
  targetWidthM: number;    // 타겟의 너비 (미터)
  targetHeightM: number;   // 타겟의 높이 (미터)
  imageWidthPx: number;    // 이미지 너비 (픽셀)
  imageHeightPx: number;   // 이미지 높이 (픽셀)
}) {
  // 타겟과 이미지의 비율
  const targetAspect = targetWidthM / targetHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  
  // object-fit: cover - 한 축은 이미지와 동일, 다른 축은 비율에 맞춤
  let targetWidthPx: number;
  let targetHeightPx: number;
  let panAxis: 'horizontal' | 'vertical' | 'none';
  
  if (imageAspect > targetAspect) {
    // 이미지가 더 가로형 → 타겟 높이를 이미지에 맞춤
    targetHeightPx = imageHeightPx;
    targetWidthPx = imageHeightPx * targetAspect;
    panAxis = 'horizontal';
  } else if (imageAspect < targetAspect) {
    // 이미지가 더 세로형 → 타겟 너비를 이미지에 맞춤
    targetWidthPx = imageWidthPx;
    targetHeightPx = imageWidthPx / targetAspect;
    panAxis = 'vertical';
  } else {
    // 비율이 정확히 같음
    targetWidthPx = imageWidthPx;
    targetHeightPx = imageHeightPx;
    panAxis = 'none';
  }
  
  return {
    targetWidthPx,
    targetHeightPx,
    panAxis,
    panRangePx: {
      horizontal: Math.max(0, imageWidthPx - targetWidthPx),
      vertical: Math.max(0, imageHeightPx - targetHeightPx),
    }
  };
}

// 전개도를 이미지에 object-fit: cover로 맞추기
export function calculateUnfoldedCanvasOnImage({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;    // 0.1
  canvasHeightM: number;   // 0.15
  sideThicknessM: number;  // 0.006
}) {
  // 전개도 크기 (미터)
  const unfoldedWidthM = 2 * sideThicknessM + canvasWidthM;   // 0.112
  const unfoldedHeightM = 2 * sideThicknessM + canvasHeightM; // 0.162
  
  // calculateTargetFitCover를 사용하여 계산
  const result = calculateTargetFitCover({
    targetWidthM: unfoldedWidthM,
    targetHeightM: unfoldedHeightM,
    imageWidthPx,
    imageHeightPx,
  });
  
  return {
    unfoldedWidthPx: result.targetWidthPx,
    unfoldedHeightPx: result.targetHeightPx,
    panAxis: result.panAxis,
    panRangePx: result.panRangePx,
  };
}

// 각 면의 픽셀 좌표 계산
export function calculateFaceRects({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  sideThicknessM,
  panPercent, // 0-100
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  sideThicknessM: number;
  panPercent: number;
}) {
  // Step 1: 전개도 크기 계산
  const unfoldedCanvas = calculateUnfoldedCanvasOnImage({
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
      y: unfoldedY,
      width: frontWidthPx,
      height: sideHeightPx,
    },
    bottom: {
      x: unfoldedX + sideWidthPx,
      y: unfoldedY + sideHeightPx + frontHeightPx,
      width: frontWidthPx,
      height: sideHeightPx,
    },
  };
}

// 픽셀 좌표를 UV 좌표로 변환
export function convertPixelToUV({
  faceRects,
  imageWidthPx,
  imageHeightPx,
  flipY = false,
}: {
  faceRects: Partial<ReturnType<typeof calculateFaceRects>>;
  imageWidthPx: number;
  imageHeightPx: number;
  flipY?: boolean;
}) {
  const convertFace = (rect: { x: number; y: number; width: number; height: number }) => {
    const uMin = rect.x / imageWidthPx;
    const uMax = (rect.x + rect.width) / imageWidthPx;
    
    let vMin: number;
    let vMax: number;
    
    if (flipY) {
      // Y축 뒤집기 (Three.js 기본값)
      vMin = 1 - (rect.y + rect.height) / imageHeightPx;
      vMax = 1 - rect.y / imageHeightPx;
    } else {
      // Y축 유지 (현재 설정)
      vMin = rect.y / imageHeightPx;
      vMax = (rect.y + rect.height) / imageHeightPx;
    }
    
    return { uMin, uMax, vMin, vMax };
  };
  
  return {
    front: faceRects.front ? convertFace(faceRects.front) : undefined,
    left: faceRects.left ? convertFace(faceRects.left) : undefined,
    right: faceRects.right ? convertFace(faceRects.right) : undefined,
    top: faceRects.top ? convertFace(faceRects.top) : undefined,
    bottom: faceRects.bottom ? convertFace(faceRects.bottom) : undefined,
  };
}

// UV 좌표를 PlaneGeometry에 적용
export function applyUVToGeometry(
  geometry: THREE.PlaneGeometry,
  uvBounds: { uMin: number; uMax: number; vMin: number; vMax: number }
) {
  // PlaneGeometry의 기본 UV는 0,0 (좌하) ~ 1,1 (우상)
  // 우리가 원하는 UV 범위로 매핑
  const uvs = new Float32Array([
    uvBounds.uMin, uvBounds.vMin,  // 좌하
    uvBounds.uMax, uvBounds.vMin,  // 우하
    uvBounds.uMin, uvBounds.vMax,  // 좌상
    uvBounds.uMax, uvBounds.vMax,  // 우상
  ]);
  
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

// 살리기 모드를 위한 통합 함수
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
  const faceRects = calculateFaceRects({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    sideThicknessM,
    panPercent,
  });
  
  // Step 2: 픽셀 좌표를 UV로 변환
  const uvCoords = convertPixelToUV({
    faceRects,
    imageWidthPx,
    imageHeightPx,
    flipY: false, // 현재 설정
  });
  
  // Step 3: 각 면의 geometry 생성 및 UV 적용
  const geometries = {
    front: new THREE.PlaneGeometry(canvasWidthM, canvasHeightM),
    left: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    right: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    top: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
    bottom: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
  };
  
  // UV 적용
  if (uvCoords.front) applyUVToGeometry(geometries.front, uvCoords.front);
  if (uvCoords.left) applyUVToGeometry(geometries.left, uvCoords.left);
  if (uvCoords.right) applyUVToGeometry(geometries.right, uvCoords.right);
  if (uvCoords.top) applyUVToGeometry(geometries.top, uvCoords.top);
  if (uvCoords.bottom) applyUVToGeometry(geometries.bottom, uvCoords.bottom);
  
  return geometries;
}

// imageOffset (-1 ~ 1)을 panPercent (0 ~ 100)로 변환
function offsetToPanPercent(offset: number): number {
  return (offset + 1) * 50;
}

// 자르기 모드: 정면의 픽셀 좌표 계산
export function calculateClipModeFrontRect({
  imageWidthPx,
  imageHeightPx,
  canvasWidthM,
  canvasHeightM,
  panPercent, // 0-100
}: {
  imageWidthPx: number;
  imageHeightPx: number;
  canvasWidthM: number;
  canvasHeightM: number;
  panPercent: number;
}) {
  // Step 1: 캔버스 정면을 이미지에 object-fit: cover로 맞추기
  const canvasOnImage = calculateTargetFitCover({
    targetWidthM: canvasWidthM,
    targetHeightM: canvasHeightM,
    imageWidthPx,
    imageHeightPx,
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
    width: canvasOnImage.targetWidthPx,
    height: canvasOnImage.targetHeightPx,
  };
}

// 자르기 모드를 위한 통합 함수
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
  const frontUV = convertPixelToUV({
    faceRects: { front: frontRect },
    imageWidthPx,
    imageHeightPx,
    flipY: false,
  }).front;
  
  // Step 3: 각 면의 geometry 생성
  const geometries = {
    front: new THREE.PlaneGeometry(canvasWidthM, canvasHeightM),
    left: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    right: new THREE.PlaneGeometry(sideThicknessM, canvasHeightM),
    top: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
    bottom: new THREE.PlaneGeometry(canvasWidthM, sideThicknessM),
  };
  
  // 정면에만 UV 적용 (이미지 텍스처)
  if (frontUV) applyUVToGeometry(geometries.front, frontUV);
  
  // 옆면들은 UV 설정 없음 (캔버스 텍스처 사용)
  
  return geometries;
}


// 뒤집기 모드: 각 면에 미러링된 UV 계산
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
  const frontRect = calculateClipModeFrontRect({
    imageWidthPx,
    imageHeightPx,
    canvasWidthM,
    canvasHeightM,
    panPercent,
  });
  
  // UV로 변환
  const frontUV = convertPixelToUV({
    faceRects: { front: frontRect },
    imageWidthPx,
    imageHeightPx,
    flipY: false,
  }).front;
  
  const { uMin: uvLeft, uMax: uvRight, vMin: uvBottom, vMax: uvTop } = frontUV || { uMin: 0, uMax: 1, vMin: 0, vMax: 1 };
  
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

// 미러링이 필요한 UV에 뒤집기 적용
export function applyFlipToUV(
  geometry: THREE.PlaneGeometry,
  uvBounds: { uMin: number; uMax: number; vMin: number; vMax: number; flipX?: boolean; flipY?: boolean }
) {
  const { uMin, uMax, vMin, vMax, flipX, flipY } = uvBounds;
  
  let uvs: Float32Array;
  
  if (flipX && !flipY) {
    // X축 뒤집기
    uvs = new Float32Array([
      uMax, vMin,  // 좌하 -> 우하를 사용
      uMin, vMin,  // 우하 -> 좌하를 사용
      uMax, vMax,  // 좌상 -> 우상을 사용
      uMin, vMax,  // 우상 -> 좌상을 사용
    ]);
  } else if (!flipX && flipY) {
    // Y축 뒤집기
    uvs = new Float32Array([
      uMin, vMax,  // 좌하 -> 좌상을 사용
      uMax, vMax,  // 우하 -> 우상을 사용
      uMin, vMin,  // 좌상 -> 좌하를 사용
      uMax, vMin,  // 우상 -> 우하를 사용
    ]);
  } else {
    // 뒤집기 없음 (기본)
    uvs = new Float32Array([
      uMin, vMin,  // 좌하
      uMax, vMin,  // 우하
      uMin, vMax,  // 좌상
      uMax, vMax,  // 우상
    ]);
  }
  
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

type SimpleCanvasViewProps = {
  imageTexture: THREE.Texture | null;
  rotation: { x: number; y: number };
  imageOffset: { x: number; y: number }; // -1 to 1
  sideMode: SideMode;
};

export function SimpleCanvasViewPlanes({
  imageTexture,
  rotation,
  imageOffset,
  sideMode,
}: SimpleCanvasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 카메라 거리 계산
  const cameraDistance = useMemo(() => {
    const diagonal = Math.sqrt(0.1 ** 2 + 0.15 ** 2);
    const baseDistance = diagonal * 1.5;
    const rotationFactor = (Math.abs(rotation.y) + Math.abs(rotation.x)) * diagonal * 0.003;
    return baseDistance + rotationFactor;
  }, [rotation]);

  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, 0, cameraDistance],
        fov: 35,
      }}
      style={{ width: "100%", height: "100%" }}
      dpr={Math.min(window.devicePixelRatio || 1, 2)}
      gl={{ alpha: true, antialias: true }}
    >
      <CameraController cameraDistance={cameraDistance} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[-1, 1, 1]} intensity={1.5} castShadow />
      <directionalLight position={[0, 0, 1]} intensity={1.0} />
      <directionalLight position={[2, 1, 0]} intensity={0.8} color="#fffacd" />
      <directionalLight position={[1, 2, 0]} intensity={0.6} color="#f0f8ff" />
      
      {imageTexture && (
        <CanvasFrame
          rotation={rotation}
          imageTexture={imageTexture}
          imageOffset={imageOffset}
          sideMode={sideMode}
        />
      )}
    </Canvas>
  );
}

function CameraController({ cameraDistance }: { cameraDistance: number }) {
  useThree(({ camera }) => {
    camera.position.setZ(cameraDistance);
  });
  return null;
}

function CanvasFrame({
  rotation,
  imageTexture,
  imageOffset,
  sideMode,
}: {
  rotation: { x: number; y: number };
  imageTexture: THREE.Texture;
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(rotation.x);
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotation.y);
    }
  }, [rotation]);

  // 캔버스 크기 (미터)
  const w = 0.1; // width
  const h = 0.15; // height
  const t = 0.006; // thickness

  // 이미지 정보
  const imageWidthPx = imageTexture.image.width;
  const imageHeightPx = imageTexture.image.height;

  // 모든 geometry를 한 번만 생성 (UV는 나중에 설정)
  const frontGeometry = useMemo(() => new THREE.PlaneGeometry(w, h), [w, h]);
  const frontGeometryRef = useRef<THREE.PlaneGeometry | null>(null);
  
  // 통일된 UV 계산 - 모든 모드가 동일한 패턴 사용
  const modeUVs = useMemo(() => {
    switch (sideMode) {
      case SideMode.CLIP: {
        // 자르기 모드: 새로운 방식
        const panPercentX = offsetToPanPercent(imageOffset.x);
        const panPercentY = offsetToPanPercent(imageOffset.y);
        
        // 이미지와 캔버스 비율에 따라 적절한 pan 축 선택
        const canvasAspect = w / h;
        const imageAspect = imageWidthPx / imageHeightPx;
        const panPercent = imageAspect > canvasAspect ? panPercentX : panPercentY;
        
        // 정면의 픽셀 좌표 계산
        const frontRect = calculateClipModeFrontRect({
          imageWidthPx,
          imageHeightPx,
          canvasWidthM: w,
          canvasHeightM: h,
          panPercent,
        });
        
        // UV로 변환
        return convertPixelToUV({
          faceRects: { front: frontRect },
          imageWidthPx,
          imageHeightPx,
          flipY: false,
        });
      }
        
      case SideMode.PRESERVE:
        // panPercent 계산
        const imageAspect = imageWidthPx / imageHeightPx;
        const unfoldedAspect = (w + 2 * t) / (h + 2 * t);
        const panPercentX = offsetToPanPercent(imageOffset.x);
        const panPercentY = offsetToPanPercent(imageOffset.y);
        const panPercent = imageAspect > unfoldedAspect ? panPercentX : panPercentY;
        
        // 각 면의 픽셀 좌표 계산
        const faceRects = calculateFaceRects({
          imageWidthPx,
          imageHeightPx,
          canvasWidthM: w,
          canvasHeightM: h,
          sideThicknessM: t,
          panPercent,
        });
        
        // UV 좌표로 변환
        return convertPixelToUV({
          faceRects,
          imageWidthPx,
          imageHeightPx,
          flipY: false,
        });
        
      case SideMode.FLIP:
        return calculateFlipModeUVs({
          imageWidthPx,
          imageHeightPx,
          canvasWidthM: w,
          canvasHeightM: h,
          sideThicknessM: t,
          imageOffset,
        });
    }
  }, [sideMode, imageOffset, imageWidthPx, imageHeightPx, w, h, t]);
  
  // 정면 UV 업데이트 (모든 모드에서 동일한 방식 사용)
  useFrame(() => {
    if (modeUVs && modeUVs.front && frontGeometryRef.current) {
      applyUVToGeometry(frontGeometryRef.current, modeUVs.front);
    }
  });

  // 텍스처 설정
  const texture = useMemo(() => {
    const tex = imageTexture.clone();
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false; // 이미지 뒤집힘 방지
    tex.needsUpdate = true;
    return tex;
  }, [imageTexture]);

  // 살리기 모드: UV 좌표 계산 (가벼운 계산이므로 매번 실행)
  const preserveModeUVs = useMemo(() => {
    if (sideMode !== SideMode.PRESERVE) return null;
    
    // panPercent 계산
    const panPercentX = offsetToPanPercent(imageOffset.x);
    const panPercentY = offsetToPanPercent(imageOffset.y);
    
    // 가로/세로 중 어느 축으로 panning 가능한지 확인
    const imageAspect = imageWidthPx / imageHeightPx;
    const unfoldedAspect = (w + 2 * t) / (h + 2 * t);
    const panPercent = imageAspect > unfoldedAspect ? panPercentX : panPercentY;
    
    // 각 면의 픽셀 좌표 계산
    const faceRects = calculateFaceRects({
      imageWidthPx,
      imageHeightPx,
      canvasWidthM: w,
      canvasHeightM: h,
      sideThicknessM: t,
      panPercent,
    });
    
    // UV 좌표로 변환
    return convertPixelToUV({
      faceRects,
      imageWidthPx,
      imageHeightPx,
      flipY: false,
    });
  }, [sideMode, imageOffset, imageWidthPx, imageHeightPx, w, h, t]);

  // 뒤집기 모드에서 사용할 정면 UV 좌표
  const uvBounds = useMemo(() => {
    if (sideMode === SideMode.FLIP && modeUVs?.front) {
      return {
        uvLeft: modeUVs.front.uMin || 0,
        uvRight: modeUVs.front.uMax || 1,
        uvBottom: modeUVs.front.vMin || 0,
        uvTop: modeUVs.front.vMax || 1,
      };
    }
    return { uvLeft: 0, uvRight: 1, uvBottom: 0, uvTop: 1 };
  }, [sideMode, modeUVs]);

  return (
    <group ref={groupRef}>
      {/* 정면 */}
      <mesh position={[0, 0, t/2]}>
        <primitive object={frontGeometry} ref={frontGeometryRef} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* 뒷면 */}
      <mesh position={[0, 0, -t/2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* 왼쪽 */}
      <SideFace
        position={[-w/2, 0, 0]}
        rotation={[0, -Math.PI/2, 0]}
        size={[t, h]}
        sideMode={sideMode}
        texture={texture}
        edge="left"
        uvBounds={uvBounds}
        preserveModeUVs={preserveModeUVs}
      />

      {/* 오른쪽 */}
      <SideFace
        position={[w/2, 0, 0]}
        rotation={[0, Math.PI/2, 0]}
        size={[t, h]}
        sideMode={sideMode}
        texture={texture}
        edge="right"
        uvBounds={uvBounds}
        preserveModeUVs={preserveModeUVs}
      />

      {/* 상단 */}
      <SideFace
        position={[0, h/2, 0]}
        rotation={[-Math.PI/2, 0, 0]}
        size={[w, t]}
        sideMode={sideMode}
        texture={texture}
        edge="top"
        uvBounds={uvBounds}
        preserveModeUVs={preserveModeUVs}
      />

      {/* 하단 */}
      <SideFace
        position={[0, -h/2, 0]}
        rotation={[Math.PI/2, 0, 0]}
        size={[w, t]}
        sideMode={sideMode}
        texture={texture}
        edge="bottom"
        uvBounds={uvBounds}
        preserveModeUVs={preserveModeUVs}
      />
    </group>
  );
}

// 옆면 컴포넌트
function SideFace({
  position,
  rotation,
  size,
  sideMode,
  texture,
  edge,
  uvBounds,
  preserveModeUVs,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  sideMode: SideMode;
  texture: THREE.Texture;
  edge: 'left' | 'right' | 'top' | 'bottom';
  uvBounds: { 
    uvLeft: number; 
    uvRight: number; 
    uvBottom: number; 
    uvTop: number;
  };
  preserveModeUVs?: ReturnType<typeof convertPixelToUV> | null;
}) {
  const canvasTextureRef = useRef<THREE.Texture | null>(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);
  
  // 살리기 모드에서 UV 업데이트 (useFrame으로 GPU 통신 최적화)
  useFrame(() => {
    if (sideMode === SideMode.PRESERVE && preserveModeUVs && geometryRef.current) {
      const uvData = preserveModeUVs[edge];
      if (uvData) {
        applyUVToGeometry(geometryRef.current, uvData);
      }
    }
  });
  
  // 캔버스 텍스처 로드 (항상 로드해두고 필요할 때 사용)
  useEffect(() => {
    // 이미 로드된 텍스처가 있고 사이즈가 같다면 재사용
    if (canvasTextureRef.current) {
      const tex = canvasTextureRef.current;
      const repeatX = size[0] / 0.02;
      const repeatY = size[1] / 0.02;
      tex.repeat.set(repeatX, repeatY);
      tex.needsUpdate = true;
      setTextureLoaded(true);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      '/canvas-texture.jpg', 
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const repeatX = size[0] / 0.02;
        const repeatY = size[1] / 0.02;
        tex.repeat.set(repeatX, repeatY);
        canvasTextureRef.current = tex;
        setTextureLoaded(true);
      },
      undefined,
      (error) => {
        console.error(`Failed to load canvas texture for ${edge} side:`, error);
        setTextureLoaded(false);
      }
    );
  }, [size, edge]); // edge도 의존성에 추가

  // 기본 Geometry (자르기 모드용)
  const clipGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(size[0], size[1]);
  }, [size]);

  // 살리기 모드 Geometry (새로운 방식 - UV는 useFrame에서 업데이트)
  const preserveGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(size[0], size[1]);
  }, [size]);

  // 뒤집기 모드 Geometry (각 면에 뒤집힌 이미지 매핑)
  const flipGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size[0], size[1]);
    const { uvLeft, uvRight, uvBottom, uvTop } = uvBounds;
    
    let uvs: Float32Array = new Float32Array(8); // 기본값 초기화
    
    // 옆면 두께와 캔버스 크기를 고려한 스케일 계산
    const t = 0.006;
    const w = 0.1;
    const h = 0.15;
    
    // 각 면에 따라 이미지를 뒤집어서 UV 매핑
    switch (edge) {
      case 'left':
        // 왼쪽면: 정면의 왼쪽 가장자리부터 시작해서 왼쪽으로 뒤집기
        const leftScale = t / w; // 옆면너비 / 정면너비
        const leftWidth = (uvRight - uvLeft) * leftScale;
        // UV 좌표를 0-1 범위로 클램핑
        const leftUvLeft = Math.min(1, Math.max(0, uvLeft));
        const leftUvRight = Math.min(1, Math.max(0, uvLeft + leftWidth));
        const leftUvBottom = Math.min(1, Math.max(0, uvBottom));
        const leftUvTop = Math.min(1, Math.max(0, uvTop));
        uvs = new Float32Array([
          leftUvRight, leftUvBottom,  // 좌하 (뒤집어서)
          leftUvLeft, leftUvBottom,   // 우하 (정면 왼쪽 가장자리)
          leftUvRight, leftUvTop,     // 좌상 (뒤집어서)
          leftUvLeft, leftUvTop,      // 우상 (정면 왼쪽 가장자리)
        ]);
        break;
        
      case 'right':
        // 오른쪽면: 정면의 오른쪽 가장자리부터 시작해서 오른쪽으로 뒤집기
        const rightScale = t / w;
        const rightWidth = (uvRight - uvLeft) * rightScale;
        // UV 좌표를 0-1 범위로 클램핑
        const rightUvLeft = Math.min(1, Math.max(0, uvRight - rightWidth));
        const rightUvRight = Math.min(1, Math.max(0, uvRight));
        const rightUvBottom = Math.min(1, Math.max(0, uvBottom));
        const rightUvTop = Math.min(1, Math.max(0, uvTop));
        uvs = new Float32Array([
          rightUvRight, rightUvBottom, // 좌하 (정면 오른쪽 가장자리)
          rightUvLeft, rightUvBottom,  // 우하 (뒤집어서)
          rightUvRight, rightUvTop,    // 좌상 (정면 오른쪽 가장자리)
          rightUvLeft, rightUvTop,     // 우상 (뒤집어서)
        ]);
        break;
        
      case 'top':
        // 상단면: 정면의 상단 가장자리부터 시작해서 위로 뒤집기
        const topScale = t / h;
        const topHeight = (uvTop - uvBottom) * topScale;
        // UV 좌표를 0-1 범위로 클램핑
        const topUvTop = Math.min(1, Math.max(0, uvTop));
        const topUvBottom = Math.min(1, Math.max(0, uvTop - topHeight));
        const topUvLeft = Math.min(1, Math.max(0, uvLeft));
        const topUvRight = Math.min(1, Math.max(0, uvRight));
        uvs = new Float32Array([
          topUvLeft, topUvTop,     // 좌하 (정면 상단 가장자리)
          topUvRight, topUvTop,    // 우하 (정면 상단 가장자리)
          topUvLeft, topUvBottom,  // 좌상 (뒤집어서)
          topUvRight, topUvBottom, // 우상 (뒤집어서)
        ]);
        break;
        
      case 'bottom':
        // 하단면: 정면의 하단 가장자리부터 시작해서 아래로 뒤집기
        const bottomScale = t / h;
        const bottomHeight = (uvTop - uvBottom) * bottomScale;
        // UV 좌표를 0-1 범위로 클램핑
        const bottomUvBottom = Math.min(1, Math.max(0, uvBottom));
        const bottomUvTop = Math.min(1, Math.max(0, uvBottom + bottomHeight));
        const bottomUvLeft = Math.min(1, Math.max(0, uvLeft));
        const bottomUvRight = Math.min(1, Math.max(0, uvRight));
        uvs = new Float32Array([
          bottomUvLeft, bottomUvTop,    // 좌하 (뒤집어서)
          bottomUvRight, bottomUvTop,   // 우하 (뒤집어서)
          bottomUvLeft, bottomUvBottom, // 좌상 (정면 하단 가장자리)
          bottomUvRight, bottomUvBottom,// 우상 (정면 하단 가장자리)
        ]);
        break;
      default:
        console.error(`Unknown edge in flipGeometry: ${edge}`);
        break;
    }
    
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [size, edge, uvBounds]);

  // Geometry 선택 (항상 유효한 geometry 존재)
  const selectedGeometry = {
    [SideMode.CLIP]: clipGeometry,
    [SideMode.PRESERVE]: preserveGeometry,
    [SideMode.FLIP]: flipGeometry
  }[sideMode];

  // 텍스처와 색상 선택
  const canvasTexture = canvasTextureRef.current;
  const materialProps = {
    [SideMode.CLIP]: {
      map: textureLoaded ? canvasTexture : null,
      color: textureLoaded && canvasTexture ? '#ffffff' : '#f5f5f5'
    },
    [SideMode.PRESERVE]: {
      map: texture,
      color: '#ffffff'
    },
    [SideMode.FLIP]: {
      map: texture,
      color: '#ffffff'
    }
  }[sideMode];


  return (
    <mesh position={position} rotation={rotation}>
      <primitive object={selectedGeometry} ref={geometryRef} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}