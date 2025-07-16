import { useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { calculateCameraDistance } from "./utils/textureOptimization";
import { useTextureLoader } from "./hooks/useTextureLoader";
import { CanvasFrame } from "./components/CanvasFrame";
import type { SideMode } from "../../../../../shared/types";

export function CanvasView({
  imageSource,
  rotation,
  sideMode,
  imageOffset,
}: {
  imageSource: string | File;
  rotation: { x: number; y: number };
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
}) {
  const textureResult = useTextureLoader(imageSource);
  const cameraDistance = useMemo(
    () => calculateCameraDistance(rotation),
    [rotation]
  );

  if (textureResult.type === "loading") {
    return <div>Loading...</div>;
  }
  if (textureResult.type === "error") {
    return <div>Error: {textureResult.error.message}</div>;
  }
  const texture = textureResult.texture;

  return (
    <Canvas
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
      <CanvasFrame
        texture={texture}
        sideMode={sideMode}
        imageOffset={imageOffset}
        rotation={rotation}
      />
    </Canvas>
  );
}

function CameraController({ cameraDistance }: { cameraDistance: number }) {
  useThree(({ camera }) => {
    camera.position.setZ(cameraDistance);
  });
  return null;
}
