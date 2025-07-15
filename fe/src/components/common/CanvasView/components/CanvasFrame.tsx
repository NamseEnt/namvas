import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { canvasProductSizeM } from "../constants";
import { SideMode, type UVBounds } from "../types";
import { SideFaces } from "./SideFaces";

export function CanvasFrame({
  texture,
  uvBounds,
  sideMode,
  imageOffset,
  rotation
}: {
  texture: THREE.Texture | null;
  uvBounds: UVBounds | null;
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
  rotation: { x: number; y: number };
}) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(function updateRotation() {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(rotation.x);
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotation.y);
    }
  }, [rotation]);

  const frontGeometry = useMemo(() => {
    if (!uvBounds) return null;
    
    const geo = new THREE.PlaneGeometry(canvasProductSizeM.widthM, canvasProductSizeM.heightM);
    const uvs = new Float32Array([
      uvBounds.uMin, uvBounds.vMax,
      uvBounds.uMax, uvBounds.vMax,
      uvBounds.uMin, uvBounds.vMin,
      uvBounds.uMax, uvBounds.vMin,
    ]);
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, [uvBounds]);

  const front = texture && frontGeometry ? (
    <mesh position={[0, 0, canvasProductSizeM.thicknessM / 2]} geometry={frontGeometry}>
      <meshStandardMaterial map={texture} />
    </mesh>
  ) : null;

  return (
    <group ref={groupRef}>
      {front}
      <SideFaces sideMode={sideMode} texture={texture || undefined} imageOffset={imageOffset} />
    </group>
  );
}