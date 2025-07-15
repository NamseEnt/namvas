import { useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { type CanvasViewProps } from "./types";
import { calculateCameraDistance } from "./utils/textureOptimization";
import { useTextureLoader } from "./hooks/useTextureLoader";
import { useUvBounds } from "./hooks/useUvBounds";
import { CanvasFrame } from "./components/CanvasFrame";

export function CanvasView({
  imageSource,
  rotation,
  sideMode,
  imageOffset
}: CanvasViewProps) {
  const { texture, loading, error } = useTextureLoader(imageSource);
  const uvBounds = useUvBounds({ texture, imageOffset, sideMode });
  const cameraDistance = useMemo(() => calculateCameraDistance(rotation), [rotation]);

  if (loading) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>이미지를 불러올 수 없습니다</div>
      </div>
    );
  }

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
        uvBounds={uvBounds}
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

export { SideMode, type CanvasViewProps } from "./types";