import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// 옆면 처리 모드
enum SideMode {
  CLIP = "clip",     // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip"      // 뒤집기
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
  
  // 전개도 비율
  const unfoldedAspect = unfoldedWidthM / unfoldedHeightM;
  const imageAspect = imageWidthPx / imageHeightPx;
  
  // object-fit: cover - 한 축은 이미지와 동일, 다른 축은 비율에 맞춤
  let unfoldedWidthPx: number;
  let unfoldedHeightPx: number;
  let panAxis: 'horizontal' | 'vertical' | 'none';
  
  if (imageAspect > unfoldedAspect) {
    // 이미지가 더 가로형 → 높이를 이미지에 맞춤
    unfoldedHeightPx = imageHeightPx;
    unfoldedWidthPx = imageHeightPx * unfoldedAspect;
    panAxis = 'horizontal';
  } else if (imageAspect < unfoldedAspect) {
    // 이미지가 더 세로형 → 너비를 이미지에 맞춤
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
  faceRects: ReturnType<typeof calculateFaceRects>;
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
    front: convertFace(faceRects.front),
    left: convertFace(faceRects.left),
    right: convertFace(faceRects.right),
    top: convertFace(faceRects.top),
    bottom: convertFace(faceRects.bottom),
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
  applyUVToGeometry(geometries.front, uvCoords.front);
  applyUVToGeometry(geometries.left, uvCoords.left);
  applyUVToGeometry(geometries.right, uvCoords.right);
  applyUVToGeometry(geometries.top, uvCoords.top);
  applyUVToGeometry(geometries.bottom, uvCoords.bottom);
  
  return geometries;
}

// imageOffset (-1 ~ 1)을 panPercent (0 ~ 100)로 변환
function offsetToPanPercent(offset: number): number {
  return (offset + 1) * 50;
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
  const imageAspect = imageWidthPx / imageHeightPx;
  const canvasAspect = w / h;

  let scaleX = 1, scaleY = 1;
  let preserveScaleX = 1, preserveScaleY = 1;
  
  // 기본 UV (자르기, 뒤집기 모드용)
  if (imageAspect > canvasAspect) {
    scaleY = 1;
    scaleX = canvasAspect / imageAspect;
  } else {
    scaleX = 1;
    scaleY = imageAspect / canvasAspect;
  }

  // 살리기 모드용 UV (정면 기준으로 계산)
  // 살리기 모드에서는 이미지를 정면 크기에 맞추고, 넘치는 부분을 옆면에 표시
  if (imageAspect > canvasAspect) {
    // 가로가 긴 이미지: 좌우로 넘침
    preserveScaleY = 1;
    preserveScaleX = canvasAspect / imageAspect;
  } else {
    // 세로가 긴 이미지: 상하로 넘침
    preserveScaleX = 1;
    preserveScaleY = imageAspect / canvasAspect;
  }
  
  console.log(`[DEBUG] Preserve UV calculations:`, {
    imageAspect,
    canvasAspect,
    preserveScaleX,
    preserveScaleY,
    mode: imageAspect > canvasAspect ? 'horizontal overflow' : 'vertical overflow'
  });

  const maxOffsetX = (1 - scaleX) / 2;
  const maxOffsetY = (1 - scaleY) / 2;
  const offsetX = imageOffset.x * maxOffsetX;
  const offsetY = imageOffset.y * maxOffsetY;

  // 살리기 모드는 새로운 방식에서 panPercent로 처리됨

  // UV 좌표
  const uvLeft = (1 - scaleX) / 2 - offsetX;
  const uvRight = 1 - (1 - scaleX) / 2 - offsetX;
  const uvBottom = (1 - scaleY) / 2 - offsetY;
  const uvTop = 1 - (1 - scaleY) / 2 - offsetY;
  
  // 살리기 모드용 UV 계산은 이제 사용하지 않음 (새로운 방식으로 대체)

  // 정면 geometry와 UV 설정
  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(w, h);
    // 살리기 모드가 아닐 때만 UV 설정 (살리기 모드는 useFrame에서 업데이트)
    if (sideMode !== SideMode.PRESERVE) {
      const uvs = new Float32Array([
        uvLeft, uvBottom,   // 좌하
        uvRight, uvBottom,  // 우하
        uvLeft, uvTop,      // 좌상
        uvRight, uvTop,     // 우상
      ]);
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }
    return geo;
  }, [w, h, uvLeft, uvRight, uvBottom, uvTop, sideMode]);
  
  const frontGeometryRef = useRef<THREE.PlaneGeometry | null>(null);
  
  // 정면 UV 업데이트 (살리기 모드)
  useFrame(() => {
    if (sideMode === SideMode.PRESERVE && preserveModeUVs && frontGeometryRef.current) {
      applyUVToGeometry(frontGeometryRef.current, preserveModeUVs.front);
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
        uvBounds={{ uvLeft, uvRight, uvBottom, uvTop }}
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
        uvBounds={{ uvLeft, uvRight, uvBottom, uvTop }}
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
        uvBounds={{ uvLeft, uvRight, uvBottom, uvTop }}
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
        uvBounds={{ uvLeft, uvRight, uvBottom, uvTop }}
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

    console.log(`[DEBUG] Loading canvas texture for ${edge} side, sideMode: ${sideMode}, size:`, size);
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
        console.log(`[DEBUG] Canvas texture loaded successfully for ${edge} side`);
      },
      undefined,
      (error) => {
        console.error(`[DEBUG] Failed to load canvas texture for ${edge} side:`, error);
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
        console.error(`[DEBUG] Unknown edge in flipGeometry: ${edge}`);
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

  console.log(`[DEBUG] Rendering ${edge} side - sideMode: ${sideMode}, selectedGeometry: ${selectedGeometry ? 'exists' : 'null'}, materialProps:`, materialProps);

  return (
    <mesh position={position} rotation={rotation}>
      <primitive object={selectedGeometry} ref={geometryRef} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}