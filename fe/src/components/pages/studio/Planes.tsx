import { useRef, useEffect, useMemo, createContext, useContext } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ClipSideFaces } from "./ClipSideFaces";
import { PreserveSideFaces } from "./PreserveSideFaces";
import { FlipSideFaces } from "./FlipSideFaces";
import { h, t, w } from "./types";

// 옆면 처리 모드
enum SideMode {
  CLIP = "clip", // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip", // 뒤집기
}

export const PlanesContext = createContext<{
  sideMode: SideMode;
  uvBounds: {
    left: number;
    right: number;
    bottom: number;
    top: number;
  };
  imageTexture: THREE.Texture;
}>(null!);

export function Planes({
  imageTexture,
  rotation,
  imageOffset,
  sideMode,
}: {
  imageTexture: THREE.Texture;
  rotation: { x: number; y: number };
  imageOffset: { x: number; y: number }; // -1 to 1
  sideMode: SideMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 카메라 거리 계산
  const cameraDistance = useMemo(() => {
    const diagonal = Math.sqrt(0.1 ** 2 + 0.15 ** 2);
    const baseDistance = diagonal * 1.5;
    const rotationFactor =
      (Math.abs(rotation.y) + Math.abs(rotation.x)) * diagonal * 0.003;
    return baseDistance + rotationFactor;
  }, [rotation]);

  const uvBounds = useMemo(() => {
    return getUvBounds({
      imageWh: {
        width: imageTexture.image.width,
        height: imageTexture.image.height,
      },
      imageOffset,
    });
  }, [imageTexture, imageOffset]);

  return (
    <PlanesContext.Provider value={{ sideMode, uvBounds, imageTexture }}>
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
        <directionalLight
          position={[2, 1, 0]}
          intensity={0.8}
          color="#fffacd"
        />
        <directionalLight
          position={[1, 2, 0]}
          intensity={0.6}
          color="#f0f8ff"
        />

        {imageTexture && (
          <CanvasFrame rotation={rotation} imageTexture={imageTexture} />
        )}
      </Canvas>
    </PlanesContext.Provider>
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
}: {
  rotation: { x: number; y: number };
  imageTexture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { uvBounds } = useContext(PlanesContext);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(rotation.x);
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotation.y);
    }
  }, [rotation]);

  // 정면 geometry와 UV 설정
  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(w, h);
    // PlaneGeometry의 기본 UV 순서:
    // 0: (0,0) - 좌하
    // 1: (1,0) - 우하
    // 2: (0,1) - 좌상
    // 3: (1,1) - 우상
    const uvs = new Float32Array([
      uvBounds.left,
      uvBounds.bottom, // 좌하
      uvBounds.right,
      uvBounds.bottom, // 우하
      uvBounds.left,
      uvBounds.top, // 좌상
      uvBounds.right,
      uvBounds.top, // 우상
    ]);
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [uvBounds]);

  return (
    <group ref={groupRef}>
      {/* 정면 */}
      <mesh position={[0, 0, t / 2]} geometry={frontGeometry}>
        <meshStandardMaterial map={imageTexture} />
      </mesh>

      <SideFaces />
    </group>
  );
}

function SideFaces() {
  const { sideMode } = useContext(PlanesContext);

  if (sideMode === SideMode.CLIP) {
    return <ClipSideFaces />;
  }
  if (sideMode === SideMode.PRESERVE) {
    return <PreserveSideFaces />;
  }
  if (sideMode === SideMode.FLIP) {
    return <FlipSideFaces />;
  }
}

function getUvBounds({
  imageWh,
  imageOffset,
}: {
  imageWh: { width: number; height: number };
  imageOffset: { x: number; y: number };
}) {
  // 캔버스 크기 (미터)
  const w = 0.1; // width
  const h = 0.15; // height

  // UV 계산
  const imageAspect = imageWh.width / imageWh.height;
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
  const left = (1 - scaleX) / 2 - offsetX;
  const right = 1 - (1 - scaleX) / 2 - offsetX;
  const bottom = (1 - scaleY) / 2 - offsetY;
  const top = 1 - (1 - scaleY) / 2 - offsetY;

  return { left, right, bottom, top };
}
