import { useMemo, useContext } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { lrtbs, positions, rotations, sizes } from "./types";
import { PlanesContext } from "./Planes";

export function FlipSideFaces() {
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
    return {
      left: new Float32Array([
        uvBounds.right,
        uvBounds.bottom, // 좌하 -> 우하를 사용
        uvBounds.left,
        uvBounds.bottom, // 우하 -> 좌하를 사용
        uvBounds.right,
        uvBounds.top, // 좌상 -> 우상을 사용
        uvBounds.left,
        uvBounds.top, // 우상 -> 좌상을 사용
      ]),
      top: new Float32Array([
        uvBounds.left,
        uvBounds.top, // 좌하 -> 좌상을 사용
        uvBounds.right,
        uvBounds.top, // 우하 -> 우상을 사용
        uvBounds.left,
        uvBounds.bottom, // 좌상 -> 좌하를 사용
        uvBounds.right,
        uvBounds.bottom, // 우상 -> 우하를 사용
      ]),
      right: new Float32Array([
        uvBounds.right,
        uvBounds.bottom, // 좌하 -> 우하를 사용
        uvBounds.left,
        uvBounds.bottom, // 우하 -> 좌하를 사용
        uvBounds.right,
        uvBounds.top, // 좌상 -> 우상을 사용
        uvBounds.left,
        uvBounds.top, // 우상 -> 좌상을 사용
      ]),
      bottom: new Float32Array([
        uvBounds.left,
        uvBounds.top, // 좌하 -> 좌상을 사용
        uvBounds.right,
        uvBounds.top, // 우하 -> 우상을 사용
        uvBounds.left,
        uvBounds.bottom, // 좌상 -> 좌하를 사용
        uvBounds.right,
        uvBounds.bottom, // 우상 -> 우하를 사용
      ]),
    };
  }, [uvBounds]);
}
