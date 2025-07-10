import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { canvasProductSizeM } from "./constants";
import { calculateCameraDistance, createCanvasTexture } from "./utils";
import { type Artwork } from "../../../../../shared/types";

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

  return (
    <Canvas
      camera={{
        position: [0, 0, cameraDistance],
        fov: 35,
      }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true }}
    >
      <CameraController cameraDistance={cameraDistance} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[-1, 1, 1]} intensity={1.5} castShadow />
      <directionalLight position={[0, 0, 1]} intensity={1.0} />
      <directionalLight position={[2, 1, 0]} intensity={0.8} color="#fffacd" />
      <directionalLight position={[1, 2, 0]} intensity={0.6} color="#f0f8ff" />
      <CanvasFrame rotation={rotation} src={src} settings={settings} />
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
}: {
  rotation: { x: number; y: number };
  src: CanvasViewSrc | undefined;
  settings: CanvasRenderSettings;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [crossTexture, setCrossTexture] = useState<THREE.Texture>();

  useEffect(
    function loadCanvasTexture() {
      createCanvasTexture({
        src,
        settings,
      })
        .then((texture) => {
          setCrossTexture(texture);
        })
        .catch((error) => {
          console.error("❌ CanvasView createCanvasTexture error:", error);
        });
    },
    [src?.type, src?.type === "image" ? src.image : src?.type === "url" ? src.url : undefined, settings.dpi, settings.imageCenterXyInch?.x, settings.imageCenterXyInch?.y, settings.sideProcessing?.type, settings.canvasBackgroundColor]
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
      <CustomCanvasGeometry crossTexture={crossTexture} />
    </group>
  );
}

function CustomCanvasGeometry({
  crossTexture,
}: {
  crossTexture: THREE.Texture;
}) {
  // utils.ts와 동일한 계산 방식 사용
  const pixelScale = 4000;
  const frontWidth = canvasProductSizeM.widthM * pixelScale;    // 392px
  const frontHeight = canvasProductSizeM.heightM * pixelScale;  // 592px  
  const sideThickness = canvasProductSizeM.thicknessM * pixelScale; // 24px
  const totalWidth = frontWidth + sideThickness * 2;
  const totalHeight = frontHeight + sideThickness * 2;

  const frontLeft = sideThickness / totalWidth;
  const frontRight = (sideThickness + frontWidth) / totalWidth;
  const frontTop = sideThickness / totalHeight;
  const frontBottom = (sideThickness + frontHeight) / totalHeight;


  const leftLeft = 0;
  const leftRight = frontLeft;
  const rightLeft = frontRight;
  const rightRight = 1;

  const topTop = 0;
  const topBottom = frontTop;
  const bottomTop = frontBottom;
  const bottomBottom = 1;

  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;
    const uvArray = uvAttribute.array as Float32Array;

    uvArray[0] = frontLeft;
    uvArray[1] = frontBottom;
    uvArray[2] = frontRight;
    uvArray[3] = frontBottom;
    uvArray[4] = frontLeft;
    uvArray[5] = frontTop;
    uvArray[6] = frontRight;
    uvArray[7] = frontTop;

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, frontTop, frontBottom]);

  const rightGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.thicknessM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, rightLeft, frontBottom);
    uvAttribute.setXY(1, rightRight, frontBottom);
    uvAttribute.setXY(2, rightLeft, frontTop);
    uvAttribute.setXY(3, rightRight, frontTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [rightLeft, rightRight, frontTop, frontBottom]);

  const leftGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.thicknessM,
      canvasProductSizeM.heightM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, leftLeft, frontBottom);
    uvAttribute.setXY(1, leftRight, frontBottom);
    uvAttribute.setXY(2, leftLeft, frontTop);
    uvAttribute.setXY(3, leftRight, frontTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [leftLeft, leftRight, frontTop, frontBottom]);

  const topGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.thicknessM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, frontLeft, bottomBottom);
    uvAttribute.setXY(1, frontRight, bottomBottom);
    uvAttribute.setXY(2, frontLeft, bottomTop);
    uvAttribute.setXY(3, frontRight, bottomTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, bottomTop, bottomBottom]);

  const bottomGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      canvasProductSizeM.widthM,
      canvasProductSizeM.thicknessM
    );
    const uvAttribute = geo.getAttribute("uv") as THREE.BufferAttribute;

    uvAttribute.setXY(0, frontLeft, topBottom);
    uvAttribute.setXY(1, frontRight, topBottom);
    uvAttribute.setXY(2, frontLeft, topTop);
    uvAttribute.setXY(3, frontRight, topTop);

    uvAttribute.needsUpdate = true;
    return geo;
  }, [frontLeft, frontRight, topTop, topBottom]);

  return (
    <>
      <mesh
        position={[0, 0, canvasProductSizeM.thicknessM / 2]}
        geometry={frontGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[canvasProductSizeM.widthM / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        geometry={rightGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[-canvasProductSizeM.widthM / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        geometry={leftGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

      <mesh
        position={[0, canvasProductSizeM.heightM / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={topGeometry}
      >
        <meshStandardMaterial map={crossTexture} toneMapped={false} />
      </mesh>

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
