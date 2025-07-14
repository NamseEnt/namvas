import { useMemo, useContext } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { lrtbs, positions, rotations, sizes } from "./types";
import { PlanesContext } from "./Planes";

export function PreserveSideFaces() {
  const canvasTexture = useLoader(THREE.TextureLoader, "/canvas-texture.jpg");
  const uvs = useUvs();
  const geos = useMemo(() => {
    return lrtbs.reduce(
      (acc, edge) => {
        acc[edge] = new THREE.PlaneGeometry(sizes[edge][0], sizes[edge][1]);
        acc[edge].setAttribute("uv", new THREE.BufferAttribute(uvs[edge], 2));
        return acc;
      },
      {} as Record<(typeof lrtbs)[number], THREE.PlaneGeometry>
    );
  }, [uvs]);

  const meshes = lrtbs.map((edge) => {
    return (
      <mesh
        key={edge}
        position={positions[edge]}
        rotation={rotations[edge]}
        geometry={geos[edge]}
      >
        <meshStandardMaterial map={canvasTexture} />
      </mesh>
    );
  });

  return <>{meshes}</>;
}

function useUvs() {
  const { uvBounds } = useContext(PlanesContext);

  return useMemo(() => {
    const sideThickness = 0.006; // 옆면 두께 6mm
    const frontWidth = 0.1; // 정면 너비 100mm
    const frontHeight = 0.15; // 정면 높이 150mm

    const leftUVWidth = sideThickness / frontWidth;
    const rightUVWidth = sideThickness / frontWidth;
    const topUVHeight = sideThickness / frontHeight;
    const bottomUVHeight = sideThickness / frontHeight;

    return {
      left: new Float32Array([
        uvBounds.left - leftUVWidth,
        uvBounds.bottom,
        uvBounds.left,
        uvBounds.bottom,
        uvBounds.left - leftUVWidth,
        uvBounds.top,
        uvBounds.left,
        uvBounds.top,
      ]),
      right: new Float32Array([
        uvBounds.right,
        uvBounds.bottom,
        uvBounds.right + rightUVWidth,
        uvBounds.bottom,
        uvBounds.right,
        uvBounds.top,
        uvBounds.right + rightUVWidth,
        uvBounds.top,
      ]),
      top: new Float32Array([
        uvBounds.left,
        uvBounds.top,
        uvBounds.right,
        uvBounds.top,
        uvBounds.left,
        uvBounds.top + topUVHeight,
        uvBounds.right,
        uvBounds.top + topUVHeight,
      ]),
      bottom: new Float32Array([
        uvBounds.left,
        uvBounds.bottom - bottomUVHeight,
        uvBounds.right,
        uvBounds.bottom - bottomUVHeight,
        uvBounds.left,
        uvBounds.bottom,
        uvBounds.right,
        uvBounds.bottom,
      ]),
    };
  }, [uvBounds]);
}
