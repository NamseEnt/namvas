import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { canvasProductSizeM } from "./constants";
import { calculateCameraDistance, createCanvasTexture } from "./utils";
// import { type Artwork } from "../../../../../shared/types";

export function CanvasView({
  rotation,
  src,
  settings,
}: {
  rotation: { x: number; y: number };
  src: CanvasViewSrc | undefined;
  settings: CanvasRenderSettings;
}) {
  const cameraDistance = calculateCameraDistance(rotation);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Canvas 크기 감지 및 업데이트
  useEffect(function detectCanvasSize() {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newSize = { 
          width: rect.width, 
          height: rect.height 
        };
        setCanvasSize(newSize);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, 0, cameraDistance],
        fov: 35,
      }}
      style={{ 
        width: "100%", 
        height: "100%",
        willChange: "auto", // GPU 레이어 최적화
        transform: "translateZ(0)" // 하드웨어 가속 강제
      }}
      dpr={Math.min(window.devicePixelRatio || 1, 2)} // 고해상도 디스플레이 지원
      gl={{ alpha: true, antialias: true }}
      frameloop="demand"
    >
      <CameraController cameraDistance={cameraDistance} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[-1, 1, 1]} intensity={1.5} castShadow />
      <directionalLight position={[0, 0, 1]} intensity={1.0} />
      <directionalLight position={[2, 1, 0]} intensity={0.8} color="#fffacd" />
      <directionalLight position={[1, 2, 0]} intensity={0.6} color="#f0f8ff" />
      <CanvasFrame rotation={rotation} src={src} settings={settings} canvasSize={canvasSize} />
    </Canvas>
  );
}

export type CanvasViewSrc =
  | { type: "url"; url: string }
  | { type: "image"; image: HTMLImageElement }
  | { type: "texture"; texture: THREE.Texture };

export type CanvasRenderSettings = Omit<
  Artwork,
  "id" | "createdAt" | "originalImageId" | "title"
>;

function CameraController({ cameraDistance }: { cameraDistance: number }) {
  useThree(({ camera }) => {
    camera.position.setZ(cameraDistance);
  });
  return null;
}
function CanvasFrame({
  rotation,
  src,
  settings,
  canvasSize,
}: {
  rotation: { x: number; y: number };
  src: CanvasViewSrc | undefined;
  settings: CanvasRenderSettings;
  canvasSize: { width: number; height: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [crossTexture, setCrossTexture] = useState<THREE.Texture>();
  
  // 이전 값 추적
  const prevRef = useRef<{
    dpi: number;
    centerX: number;
    centerY: number;
    sideProcessing: string;
    canvasWidth: number;
    canvasHeight: number;
  }>({ dpi: 0, centerX: 0, centerY: 0, sideProcessing: '', canvasWidth: 0, canvasHeight: 0 });

  // 텍스처 생성 (DPI, 위치, 캔버스 크기 변경시 재생성)
  const sideProcessingKey = JSON.stringify(settings.sideProcessing);
  
  useEffect(
    function loadCanvasTexture() {
      const current = {
        dpi: settings.dpi,
        centerX: settings.imageCenterXyInch?.x || 0,
        centerY: settings.imageCenterXyInch?.y || 0,
        sideProcessing: sideProcessingKey,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height
      };
      
      prevRef.current = current;
      
      if (!src) {
        setCrossTexture(undefined);
        return;
      }
      
      createCanvasTexture({
        src,
        settings,
        canvasSize,
      })
        .then((texture) => {
          setCrossTexture(texture);
        })
        .catch((error) => {
          console.error("❌ CanvasView createCanvasTexture error:", error);
        });
    },
    [src, settings.dpi, settings.imageCenterXyInch?.x, settings.imageCenterXyInch?.y, settings.canvasBackgroundColor, sideProcessingKey, canvasSize.width, canvasSize.height]
  );

  useEffect(
    function updateMeshRotation() {
      if (meshRef.current) {
        meshRef.current.rotation.x = (rotation.x * Math.PI) / 180;
        meshRef.current.rotation.y = (rotation.y * Math.PI) / 180;
      }
    },
    [rotation, crossTexture]
  );

  if (!crossTexture) {
    return null;
  }

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <CustomCanvasGeometry 
        crossTexture={crossTexture}
      />
    </group>
  );
}

function CustomCanvasGeometry({
  crossTexture,
}: {
  crossTexture: THREE.Texture;
}) {
  // 텍스처에서 실제 사용된 픽셀 스케일 역산
  const canvasTextureCanvas = (crossTexture as THREE.CanvasTexture).source.data as HTMLCanvasElement;
  const pixelScale = canvasTextureCanvas.width / (canvasProductSizeM.thicknessM * 2 + canvasProductSizeM.widthM);
  const thicknessPx = canvasProductSizeM.thicknessM * pixelScale;
  const frontWidthPx = canvasProductSizeM.widthM * pixelScale;
  const frontHeightPx = canvasProductSizeM.heightM * pixelScale;
  const totalWidthPx = thicknessPx * 2 + frontWidthPx;
  const totalHeightPx = thicknessPx * 2 + frontHeightPx;

  // 각 면의 UV 좌표 계산
  const frontLeft = thicknessPx / totalWidthPx;
  const frontRight = (thicknessPx + frontWidthPx) / totalWidthPx;
  const frontTop = thicknessPx / totalHeightPx;
  const frontBottom = (thicknessPx + frontHeightPx) / totalHeightPx;

  const leftLeft = 0;
  const leftRight = frontLeft;
  const rightLeft = frontRight;
  const rightRight = 1;

  const topTop = 0;
  const topBottom = frontTop;
  const bottomTop = frontBottom;
  const bottomBottom = 1;

  // 정면 geometry
  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    
    uvAttribute.setXY(0, frontLeft, frontBottom);   // 좌하
    uvAttribute.setXY(1, frontRight, frontBottom);  // 우하
    uvAttribute.setXY(2, frontLeft, frontTop);      // 좌상
    uvAttribute.setXY(3, frontRight, frontTop);     // 우상
    
    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, frontTop, frontBottom]);

  // 오른쪽 면 geometry
  const rightGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.thicknessM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    
    uvAttribute.setXY(0, rightLeft, frontBottom);   // 좌하
    uvAttribute.setXY(1, rightRight, frontBottom);  // 우하
    uvAttribute.setXY(2, rightLeft, frontTop);      // 좌상
    uvAttribute.setXY(3, rightRight, frontTop);     // 우상
    
    uvAttribute.needsUpdate = true;
    return geo;
  }, [rightLeft, rightRight, frontTop, frontBottom]);

  // 왼쪽 면 geometry
  const leftGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.thicknessM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    
    uvAttribute.setXY(0, leftLeft, frontBottom);    // 좌하
    uvAttribute.setXY(1, leftRight, frontBottom);   // 우하
    uvAttribute.setXY(2, leftLeft, frontTop);       // 좌상
    uvAttribute.setXY(3, leftRight, frontTop);      // 우상
    
    uvAttribute.needsUpdate = true;
    return geo;
  }, [leftLeft, leftRight, frontTop, frontBottom]);

  // 위쪽 면 geometry
  const topGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.thicknessM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    
    uvAttribute.setXY(0, frontLeft, topBottom);     // 좌하
    uvAttribute.setXY(1, frontRight, topBottom);    // 우하
    uvAttribute.setXY(2, frontLeft, topTop);        // 좌상
    uvAttribute.setXY(3, frontRight, topTop);       // 우상
    
    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, topTop, topBottom]);

  // 아래쪽 면 geometry
  const bottomGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.thicknessM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    
    uvAttribute.setXY(0, frontLeft, bottomBottom);  // 좌하
    uvAttribute.setXY(1, frontRight, bottomBottom); // 우하
    uvAttribute.setXY(2, frontLeft, bottomTop);     // 좌상
    uvAttribute.setXY(3, frontRight, bottomTop);    // 우상
    
    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, bottomTop, bottomBottom]);

  return (
    <>
      {/* 정면 */}
      <mesh
        position={[0, 0, canvasProductSizeM.thicknessM / 2]}
        geometry={frontGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 오른쪽 면 */}
      <mesh
        position={[canvasProductSizeM.widthM / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={rightGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 왼쪽 면 */}
      <mesh
        position={[-canvasProductSizeM.widthM / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={leftGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 위쪽 면 */}
      <mesh
        position={[0, canvasProductSizeM.heightM / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={topGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      {/* 아래쪽 면 */}
      <mesh
        position={[0, -canvasProductSizeM.heightM / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={bottomGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>
    </>
  );
}
