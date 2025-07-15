import { useMemo, useContext } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { h, lrtbs, positions, rotations, sizes, t, w } from "./types";
import { StudioContext } from "./StudioContext";

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
  const {
    state: { uploadedImage },
  } = useContext(StudioContext);
  if (!uploadedImage) {
    throw "unreachable";
  }
  const { uvBounds } = uploadedImage;

  return useMemo(() => {
    const leftUVWidth = t / w;
    const rightUVWidth = t / w;
    const topUVHeight = t / h;
    const bottomUVHeight = t / h;

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
