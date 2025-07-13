import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SideMode, offsetToPanPercent } from "./canvasModes/common";
import { createPreserveModeGeometries } from "./canvasModes/preserveMode";
import { createClipModeGeometries } from "./canvasModes/clipMode";
import { createFlipModeGeometries } from "./canvasModes/flipMode";

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

  // 각 모드별 geometry 생성
  const geometries = useMemo(() => {
    // panPercent 계산 (모든 모드에서 사용)
    const panPercentX = offsetToPanPercent(imageOffset.x);
    const panPercentY = offsetToPanPercent(imageOffset.y);
    const imageAspect = imageWidthPx / imageHeightPx;
    
    switch (sideMode) {
      case SideMode.CLIP: {
        const canvasAspect = w / h;
        const panPercent = imageAspect > canvasAspect ? panPercentX : panPercentY;
        
        return createClipModeGeometries({
          imageWidthPx,
          imageHeightPx,
          canvasWidthM: w,
          canvasHeightM: h,
          sideThicknessM: t,
          panPercent,
        });
      }
        
      case SideMode.PRESERVE: {
        const unfoldedAspect = (w + 2 * t) / (h + 2 * t);
        const panPercent = imageAspect > unfoldedAspect ? panPercentX : panPercentY;
        
        return createPreserveModeGeometries({
          imageWidthPx,
          imageHeightPx,
          canvasWidthM: w,
          canvasHeightM: h,
          sideThicknessM: t,
          panPercent,
        });
      }
        
      case SideMode.FLIP:
        return createFlipModeGeometries({
          imageWidthPx,
          imageHeightPx,
          canvasWidthM: w,
          canvasHeightM: h,
          sideThicknessM: t,
          imageOffset,
        });
    }
  }, [sideMode, imageOffset, imageWidthPx, imageHeightPx, w, h, t]);

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
      <mesh position={[0, 0, t/2]}>
        <primitive object={geometries.front} />
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
        geometry={geometries.left}
        sideMode={sideMode}
        texture={texture}
        edge="left"
      />

      {/* 오른쪽 */}
      <SideFace
        position={[w/2, 0, 0]}
        rotation={[0, Math.PI/2, 0]}
        geometry={geometries.right}
        sideMode={sideMode}
        texture={texture}
        edge="right"
      />

      {/* 상단 */}
      <SideFace
        position={[0, h/2, 0]}
        rotation={[-Math.PI/2, 0, 0]}
        geometry={geometries.top}
        sideMode={sideMode}
        texture={texture}
        edge="top"
      />

      {/* 하단 */}
      <SideFace
        position={[0, -h/2, 0]}
        rotation={[Math.PI/2, 0, 0]}
        geometry={geometries.bottom}
        sideMode={sideMode}
        texture={texture}
        edge="bottom"
      />
    </group>
  );
}

// 옆면 컴포넌트
function SideFace({
  position,
  rotation,
  geometry,
  sideMode,
  texture,
  edge,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  geometry: THREE.PlaneGeometry;
  sideMode: SideMode;
  texture: THREE.Texture;
  edge: 'left' | 'right' | 'top' | 'bottom';
}) {
  const canvasTextureRef = useRef<THREE.Texture | null>(null);
  const [textureLoaded, setTextureLoaded] = useState(false);
  
  // 캔버스 텍스처 로드 (자르기 모드용)
  useEffect(() => {
    if (sideMode !== SideMode.CLIP) {
      setTextureLoaded(false);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      '/canvas-texture.jpg', 
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        // geometry의 크기에 따라 repeat 설정
        const bbox = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position as THREE.BufferAttribute);
        const width = bbox.max.x - bbox.min.x;
        const height = bbox.max.y - bbox.min.y;
        const repeatX = width / 0.02;
        const repeatY = height / 0.02;
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
  }, [geometry, edge, sideMode]);

  // 재질 속성 결정
  const materialProps = useMemo(() => {
    switch (sideMode) {
      case SideMode.CLIP:
        return {
          map: textureLoaded ? canvasTextureRef.current : null,
          color: textureLoaded ? '#ffffff' : '#f5f5f5'
        };
      case SideMode.PRESERVE:
      case SideMode.FLIP:
        return {
          map: texture,
          color: '#ffffff'
        };
    }
  }, [sideMode, texture, textureLoaded]);

  return (
    <mesh position={position} rotation={rotation}>
      <primitive object={geometry} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}