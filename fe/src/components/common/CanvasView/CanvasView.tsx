import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { canvasProductSizeM } from "./constants";
import { calculateCameraDistance, createCanvasBackgroundTexture, createUserImageTexture, calculateZoomedUV, type UVTransform } from "./utils";
import { type Artwork } from "../../../../../shared/types";

export function CanvasView({
  rotation,
  src,
  settings,
  uvTransform = { zoom: 1, panX: 0, panY: 0 },
  onUVTransformChange,
}: {
  rotation: { x: number; y: number };
  src: CanvasViewSrc | undefined;
  settings: CanvasRenderSettings;
  uvTransform?: UVTransform;
  onUVTransformChange?: (transform: UVTransform) => void;
}) {
  const cameraDistance = calculateCameraDistance(rotation);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 마우스 인터랙션 상태
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 마우스 이벤트 핸들러
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !onUVTransformChange) {
      return;
    }

    const deltaX = event.clientX - lastMousePos.x;
    const deltaY = event.clientY - lastMousePos.y;
    setLastMousePos({ x: event.clientX, y: event.clientY });

    // 마우스 이동을 UV 좌표계로 변환 (감도 조정)
    const sensitivity = 0.001;
    const panDeltaX = -deltaX * sensitivity / uvTransform.zoom;
    const panDeltaY = deltaY * sensitivity / uvTransform.zoom;

    onUVTransformChange({
      ...uvTransform,
      panX: uvTransform.panX + panDeltaX,
      panY: uvTransform.panY + panDeltaY,
    });

    event.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!onUVTransformChange) {
      return;
    }

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, uvTransform.zoom * zoomFactor));

    onUVTransformChange({
      ...uvTransform,
      zoom: newZoom,
    });

    event.preventDefault();
  };

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
      gl={{ alpha: true, antialias: true }}
      frameloop="demand"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <CameraController cameraDistance={cameraDistance} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[-1, 1, 1]} intensity={1.5} castShadow />
      <directionalLight position={[0, 0, 1]} intensity={1.0} />
      <directionalLight position={[2, 1, 0]} intensity={0.8} color="#fffacd" />
      <directionalLight position={[1, 2, 0]} intensity={0.6} color="#f0f8ff" />
      <CanvasFrame rotation={rotation} src={src} settings={settings} uvTransform={uvTransform} />
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
  uvTransform,
}: {
  rotation: { x: number; y: number };
  src: CanvasViewSrc | undefined;
  settings: CanvasRenderSettings;
  uvTransform: UVTransform;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [canvasBackgroundTexture, setCanvasBackgroundTexture] = useState<THREE.Texture>();
  const [userImageTexture, setUserImageTexture] = useState<THREE.Texture>();

  // 캔버스 배경 텍스처 (DPI 무관, 고정 크기)
  useEffect(
    function loadCanvasBackgroundTexture() {
      createCanvasBackgroundTexture()
        .then((texture) => {
          setCanvasBackgroundTexture(texture);
        })
        .catch((error) => {
          console.error("❌ CanvasView createCanvasBackgroundTexture error:", error);
        });
    },
    [] // 한 번만 생성
  );

  // 사용자 이미지 텍스처 (이미지 변경시만 재생성)
  useEffect(
    function loadUserImageTexture() {
      if (!src) {
        setUserImageTexture(undefined);
        return;
      }
      
      createUserImageTexture(src)
        .then((texture) => {
          setUserImageTexture(texture);
        })
        .catch((error) => {
          console.error("❌ CanvasView createUserImageTexture error:", error);
        });
    },
    [src] // 이미지 변경시만 텍스처 재생성
  );

  useEffect(
    function updateMeshRotation() {
      if (meshRef.current) {
        meshRef.current.rotation.x = (rotation.x * Math.PI) / 180;
        meshRef.current.rotation.y = (rotation.y * Math.PI) / 180;
      }
    },
    [rotation, canvasBackgroundTexture, userImageTexture]
  );

  if (!canvasBackgroundTexture) {
    return null;
  }

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      <CustomCanvasGeometry 
        canvasBackgroundTexture={canvasBackgroundTexture}
        userImageTexture={userImageTexture}
        uvTransform={uvTransform} 
        settings={settings}
      />
    </group>
  );
}

function CustomCanvasGeometry({
  canvasBackgroundTexture,
  userImageTexture,
  uvTransform,
  settings,
}: {
  canvasBackgroundTexture: THREE.Texture;
  userImageTexture?: THREE.Texture;
  uvTransform: UVTransform;
  settings: CanvasRenderSettings;
}) {
  const { invalidate } = useThree();
  // utils.ts와 동일한 계산 방식 사용
  const pixelScale = 4000;
  const frontWidth = canvasProductSizeM.widthM * pixelScale;    // 392px
  const frontHeight = canvasProductSizeM.heightM * pixelScale;  // 592px  
  const sideThickness = canvasProductSizeM.thicknessM * pixelScale; // 24px
  const totalWidth = frontWidth + sideThickness * 2;
  const totalHeight = frontHeight + sideThickness * 2;

  const baseFrontLeft = sideThickness / totalWidth;
  const baseFrontRight = (sideThickness + frontWidth) / totalWidth;
  const baseFrontTop = sideThickness / totalHeight;
  const baseFrontBottom = (sideThickness + frontHeight) / totalHeight;

  // DPI와 위치를 UV transform으로 변환
  const dpiZoom = 600 / settings.dpi; // 600 DPI 기준
  const canvasWidthInch = canvasProductSizeM.widthM / 0.0254;
  const canvasHeightInch = canvasProductSizeM.heightM / 0.0254;
  const panX = settings.imageCenterXyInch.x / canvasWidthInch;
  const panY = settings.imageCenterXyInch.y / canvasHeightInch;
  
  const combinedTransform = {
    zoom: uvTransform.zoom * dpiZoom,
    panX: uvTransform.panX + panX,
    panY: uvTransform.panY + panY,
  };
  
  // UV 변환 적용
  const frontUV = calculateZoomedUV(
    baseFrontLeft, baseFrontRight, baseFrontTop, baseFrontBottom, combinedTransform
  );

  const leftLeft = 0;
  const leftRight = baseFrontLeft;
  const rightLeft = baseFrontRight;
  const rightRight = 1;

  const topTop = 0;
  const topBottom = baseFrontTop;
  const bottomTop = baseFrontBottom;
  const bottomBottom = 1;

  // 기본 geometry (한 번만 생성)
  const baseFrontGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.heightM
    );
  }, []);

  // UV 업데이트 (직접 조작)
  useEffect(
    function updateFrontGeometryUV() {
      if (!baseFrontGeometry) {
        return;
      }
      
      const uvAttribute = baseFrontGeometry.getAttribute("uv") as THREE.BufferAttribute;
      const uvArray = uvAttribute.array as Float32Array;

      uvArray[0] = frontUV.left;
      uvArray[1] = frontUV.bottom;
      uvArray[2] = frontUV.right;
      uvArray[3] = frontUV.bottom;
      uvArray[4] = frontUV.left;
      uvArray[5] = frontUV.top;
      uvArray[6] = frontUV.right;
      uvArray[7] = frontUV.top;

      uvAttribute.needsUpdate = true;
      invalidate();
    },
    [baseFrontGeometry, frontUV.left, frontUV.right, frontUV.top, frontUV.bottom, invalidate, settings.dpi, uvTransform.zoom, uvTransform.panX, uvTransform.panY]
  );

  const rightGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.thicknessM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, rightLeft, baseFrontBottom);
    uvAttribute.setXY(1, rightRight, baseFrontBottom);
    uvAttribute.setXY(2, rightLeft, baseFrontTop);
    uvAttribute.setXY(3, rightRight, baseFrontTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [rightLeft, rightRight, baseFrontTop, baseFrontBottom]);

  const leftGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.thicknessM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, leftLeft, baseFrontBottom);
    uvAttribute.setXY(1, leftRight, baseFrontBottom);
    uvAttribute.setXY(2, leftLeft, baseFrontTop);
    uvAttribute.setXY(3, leftRight, baseFrontTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [leftLeft, leftRight, baseFrontTop, baseFrontBottom]);

  const topGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.thicknessM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, baseFrontLeft, bottomBottom);
    uvAttribute.setXY(1, baseFrontRight, bottomBottom);
    uvAttribute.setXY(2, baseFrontLeft, bottomTop);
    uvAttribute.setXY(3, baseFrontRight, bottomTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [baseFrontLeft, baseFrontRight, bottomTop, bottomBottom]);

  const bottomGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.thicknessM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, baseFrontLeft, topBottom);
    uvAttribute.setXY(1, baseFrontRight, topBottom);
    uvAttribute.setXY(2, baseFrontLeft, topTop);
    uvAttribute.setXY(3, baseFrontRight, topTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [baseFrontLeft, baseFrontRight, topBottom, topTop]);

  return (
    <>
      {/* 캔버스 배경 (모든 면) */}
      <mesh
        position={[0, 0, canvasProductSizeM.thicknessM / 2]}
        geometry={baseFrontGeometry}
      >
        <meshStandardMaterial map={canvasBackgroundTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[canvasProductSizeM.widthM / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={rightGeometry}
      >
        <meshStandardMaterial map={canvasBackgroundTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[-canvasProductSizeM.widthM / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={leftGeometry}
      >
        <meshStandardMaterial map={canvasBackgroundTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[0, canvasProductSizeM.heightM / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={topGeometry}
      >
        <meshStandardMaterial map={canvasBackgroundTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[0, -canvasProductSizeM.heightM / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={bottomGeometry}
      >
        <meshStandardMaterial map={canvasBackgroundTexture} toneMapped={false} />
      </mesh>

      {/* 사용자 이미지 (정면만, DPI 적용) */}
      {userImageTexture && (
        <mesh
          position={[0, 0, canvasProductSizeM.thicknessM / 2 + 0.0001]}
          geometry={baseFrontGeometry}
        >
          <meshStandardMaterial map={userImageTexture} toneMapped={false} transparent={true} />
        </mesh>
      )}
    </>
  );
}
