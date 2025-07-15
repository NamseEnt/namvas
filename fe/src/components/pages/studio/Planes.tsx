import { useRef, useEffect, useMemo, useContext } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ClipSideFaces } from "./ClipSideFaces";
import { PreserveSideFaces } from "./PreserveSideFaces";
import { FlipSideFaces } from "./FlipSideFaces";
import { h, SideMode, t, w } from "./types";
import { StudioContext } from "./StudioContext";
import { calculateCameraDistance } from "./utils/textureOptimization";

export function Planes() {
  const { state } = useContext(StudioContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { rotation } = state;

  const cameraDistance = useMemo(() => {
    return calculateCameraDistance(rotation);
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

      <CanvasFrame />
    </Canvas>
  );
}

function CameraController({ cameraDistance }: { cameraDistance: number }) {
  useThree(({ camera }) => {
    camera.position.setZ(cameraDistance);
  });
  return null;
}

function CanvasFrame() {
  const groupRef = useRef<THREE.Group>(null);
  const {
    state: { uploadedImage, rotation },
  } = useContext(StudioContext);

  if (!uploadedImage) {
    throw "unreachable";
  }
  const { uvBounds } = uploadedImage;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(rotation.x);
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotation.y);
    }
  }, [rotation]);

  const frontGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(w, h);
    const uvs = new Float32Array([
      ...[uvBounds.left, uvBounds.top],
      ...[uvBounds.right, uvBounds.top],
      ...[uvBounds.left, uvBounds.bottom],
      ...[uvBounds.right, uvBounds.bottom],
    ]);
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [uvBounds]);

  const front = (
    <mesh position={[0, 0, t / 2]} geometry={frontGeometry}>
      <meshStandardMaterial map={uploadedImage.texture} />
    </mesh>
  );

  return (
    <group ref={groupRef}>
      {front}
      <SideFaces />
    </group>
  );
}

function SideFaces() {
  const {
    state: { sideMode },
  } = useContext(StudioContext);

  switch (sideMode) {
    case SideMode.CLIP:
      return <ClipSideFaces />;
    case SideMode.PRESERVE:
      return <PreserveSideFaces />;
    case SideMode.FLIP:
      return <FlipSideFaces />;
  }
}
