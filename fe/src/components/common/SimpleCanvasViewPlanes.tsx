import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";

// 옆면 처리 모드
enum SideMode {
  CLIP = "clip",     // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip"      // 뒤집기
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

  // UV 계산
  const imageAspect = imageTexture.image.width / imageTexture.image.height;
  const canvasAspect = w / h;

  let scaleX, scaleY;
  if (imageAspect > canvasAspect) {
    scaleY = 1;
    scaleX = canvasAspect / imageAspect;
  } else {
    scaleX = 1;
    scaleY = imageAspect / canvasAspect;
  }

  const maxOffsetX = (1 - scaleX) / 2;
  const maxOffsetY = (1 - scaleY) / 2;
  const offsetX = imageOffset.x * maxOffsetX;
  const offsetY = imageOffset.y * maxOffsetY;

  // UV 좌표
  const uvLeft = (1 - scaleX) / 2 - offsetX;
  const uvRight = 1 - (1 - scaleX) / 2 - offsetX;
  const uvBottom = (1 - scaleY) / 2 - offsetY;
  const uvTop = 1 - (1 - scaleY) / 2 - offsetY;

  // 정면 geometry와 UV 설정
  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(w, h);
    // PlaneGeometry의 기본 UV 순서:
    // 0: (0,0) - 좌하
    // 1: (1,0) - 우하
    // 2: (0,1) - 좌상
    // 3: (1,1) - 우상
    const uvs = new Float32Array([
      uvLeft, uvBottom,   // 좌하
      uvRight, uvBottom,  // 우하
      uvLeft, uvTop,      // 좌상
      uvRight, uvTop,     // 우상
    ]);
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [w, h, uvLeft, uvRight, uvBottom, uvTop]);

  // 텍스처 설정
  const texture = useMemo(() => {
    const tex = imageTexture.clone();
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false; // 이미지 뒤집힘 방지
    tex.needsUpdate = true;
    return tex;
  }, [imageTexture]);

  return (
    <group ref={groupRef}>
      {/* 정면 */}
      <mesh position={[0, 0, t/2]} geometry={frontGeometry}>
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
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  sideMode: SideMode;
  texture: THREE.Texture;
  edge: 'left' | 'right' | 'top' | 'bottom';
  uvBounds: { uvLeft: number; uvRight: number; uvBottom: number; uvTop: number };
}) {
  const [canvasTexture, setCanvasTexture] = useState<THREE.Texture | null>(null);
  
  // 캔버스 텍스처 로드 (살리기 모드용)
  useEffect(() => {
    if (sideMode === SideMode.PRESERVE) {
      const loader = new THREE.TextureLoader();
      loader.load(
        '/canvas-texture.jpg', 
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          const repeatX = size[0] / 0.02;
          const repeatY = size[1] / 0.02;
          tex.repeat.set(repeatX, repeatY);
          setCanvasTexture(tex);
          console.log('Canvas texture loaded successfully', tex);
        },
        undefined,
        (error) => {
          console.error('Failed to load canvas texture:', error);
        }
      );
    } else {
      setCanvasTexture(null);
    }
  }, [sideMode, size]);

  // 자르기 및 뒤집기 모드에서 옆면 UV 계산
  const sideGeometry = useMemo(() => {
    if (sideMode === SideMode.PRESERVE) return null;
    
    const geo = new THREE.PlaneGeometry(size[0], size[1]);
    const { uvLeft, uvRight, uvBottom, uvTop } = uvBounds;
    
    let uvs: Float32Array;
    
    // PlaneGeometry의 기본 UV 순서:
    // 0: (0,0) - 좌하
    // 1: (1,0) - 우하
    // 2: (0,1) - 좌상
    // 3: (1,1) - 우상
    
    // 옆면 크기에 따른 UV 범위 계산
    // object-fit: cover에서 보이지 않는 부분이 옆면에 표시됨
    const sideThickness = 0.006; // 옆면 두께 6mm
    const frontWidth = 0.1; // 정면 너비 100mm
    const frontHeight = 0.15; // 정면 높이 150mm
    
    switch (edge) {
      case 'left':
        // 왼쪽면: 정면 왼쪽 가장자리에서 왼쪽으로 이어지는 이미지
        const leftUVWidth = sideThickness / frontWidth; // UV 공간에서의 옆면 너비
        uvs = new Float32Array([
          uvLeft - leftUVWidth, uvBottom,   // 좌하
          uvLeft, uvBottom,                 // 우하 (정면 왼쪽 가장자리)
          uvLeft - leftUVWidth, uvTop,      // 좌상
          uvLeft, uvTop,                    // 우상 (정면 왼쪽 가장자리)
        ]);
        break;
      case 'right':
        // 오른쪽면: 정면 오른쪽 가장자리에서 오른쪽으로 이어지는 이미지
        const rightUVWidth = sideThickness / frontWidth;
        uvs = new Float32Array([
          uvRight, uvBottom,                    // 좌하 (정면 오른쪽 가장자리)
          uvRight + rightUVWidth, uvBottom,     // 우하
          uvRight, uvTop,                       // 좌상 (정면 오른쪽 가장자리)
          uvRight + rightUVWidth, uvTop,        // 우상
        ]);
        break;
      case 'top':
        // 상단면: 정면 상단 가장자리에서 위로 이어지는 이미지
        const topUVHeight = sideThickness / frontHeight;
        uvs = new Float32Array([
          uvLeft, uvTop,                        // 좌하 (정면 상단 가장자리)
          uvRight, uvTop,                       // 우하 (정면 상단 가장자리)
          uvLeft, uvTop + topUVHeight,          // 좌상
          uvRight, uvTop + topUVHeight,         // 우상
        ]);
        break;
      case 'bottom':
        // 하단면: 정면 하단 가장자리에서 아래로 이어지는 이미지
        const bottomUVHeight = sideThickness / frontHeight;
        uvs = new Float32Array([
          uvLeft, uvBottom - bottomUVHeight,    // 좌하
          uvRight, uvBottom - bottomUVHeight,   // 우하
          uvLeft, uvBottom,                     // 좌상 (정면 하단 가장자리)
          uvRight, uvBottom,                    // 우상 (정면 하단 가장자리)
        ]);
        break;
    }
    
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [size, sideMode, edge, uvBounds]);

  // 뒤집기 모드에서 옆면 UV 계산 
  const flipGeometry = useMemo(() => {
    if (sideMode !== SideMode.FLIP) return null;
    
    const geo = new THREE.PlaneGeometry(size[0], size[1]);
    const { uvLeft, uvRight, uvBottom, uvTop } = uvBounds;
    
    let uvs: Float32Array;
    
    // 각 면에 따라 이미지를 뒤집어서 UV 매핑
    switch (edge) {
      case 'left':
        // 왼쪽면: X축 반전 (좌우 뒤집기)
        uvs = new Float32Array([
          uvRight, uvBottom,  // 좌하 -> 우하를 사용
          uvLeft, uvBottom,   // 우하 -> 좌하를 사용
          uvRight, uvTop,     // 좌상 -> 우상을 사용
          uvLeft, uvTop,      // 우상 -> 좌상을 사용
        ]);
        break;
      case 'right':
        // 오른쪽면: X축 반전 (좌우 뒤집기)
        uvs = new Float32Array([
          uvRight, uvBottom,  // 좌하 -> 우하를 사용
          uvLeft, uvBottom,   // 우하 -> 좌하를 사용
          uvRight, uvTop,     // 좌상 -> 우상을 사용
          uvLeft, uvTop,      // 우상 -> 좌상을 사용
        ]);
        break;
      case 'top':
        // 상단면: Y축 반전 (상하 뒤집기)
        uvs = new Float32Array([
          uvLeft, uvTop,      // 좌하 -> 좌상을 사용
          uvRight, uvTop,     // 우하 -> 우상을 사용
          uvLeft, uvBottom,   // 좌상 -> 좌하를 사용
          uvRight, uvBottom,  // 우상 -> 우하를 사용
        ]);
        break;
      case 'bottom':
        // 하단면: Y축 반전 (상하 뒤집기)
        uvs = new Float32Array([
          uvLeft, uvTop,      // 좌하 -> 좌상을 사용
          uvRight, uvTop,     // 우하 -> 우상을 사용
          uvLeft, uvBottom,   // 좌상 -> 좌하를 사용
          uvRight, uvBottom,  // 우상 -> 우하를 사용
        ]);
        break;
    }
    
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [size, sideMode, edge, uvBounds]);

  if (sideMode === SideMode.CLIP && sideGeometry) {
    // 자르기 모드: 이미지 overflow
    return (
      <mesh position={position} rotation={rotation} geometry={sideGeometry}>
        <meshStandardMaterial map={texture} />
      </mesh>
    );
  } else if (sideMode === SideMode.PRESERVE) {
    // 살리기 모드: 캔버스 텍스처
    return (
      <mesh position={position} rotation={rotation}>
        <planeGeometry args={size} />
        <meshStandardMaterial 
          map={canvasTexture} 
          color={canvasTexture ? undefined : '#f5f5f5'} 
        />
      </mesh>
    );
  } else if (sideMode === SideMode.FLIP && flipGeometry) {
    // 뒤집기 모드: 이미지를 각 축으로 뒤집어서 표시
    return (
      <mesh position={position} rotation={rotation} geometry={flipGeometry}>
        <meshStandardMaterial map={texture} />
      </mesh>
    );
  } else {
    // 기본값: 빈 면
    return (
      <mesh position={position} rotation={rotation}>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    );
  }
}