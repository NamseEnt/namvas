import { useMemo } from "react";
import * as THREE from "three";
import { FACE_DIRECTIONS, SIDE_FACE_POSITIONS, SIDE_FACE_ROTATIONS, SIDE_FACE_SIZES } from "../types";
import { calculatePreserveModeUV } from "../utils/uvCalculations";

export function PreserveSideFaces({
  texture,
  imageOffset
}: {
  texture: THREE.Texture;
  imageOffset: { x: number; y: number };
}) {
  const uvs = useUvs(texture, imageOffset);
  const geos = useMemo(() => {
    return FACE_DIRECTIONS.reduce(
      (acc, edge) => {
        acc[edge] = new THREE.PlaneGeometry(SIDE_FACE_SIZES[edge][0], SIDE_FACE_SIZES[edge][1]);
        acc[edge].setAttribute("uv", new THREE.BufferAttribute(uvs[edge], 2));
        return acc;
      },
      {} as Record<(typeof FACE_DIRECTIONS)[number], THREE.PlaneGeometry>
    );
  }, [uvs]);

  const meshes = FACE_DIRECTIONS.map((edge) => {
    return (
      <mesh
        key={edge}
        position={SIDE_FACE_POSITIONS[edge]}
        rotation={SIDE_FACE_ROTATIONS[edge]}
        geometry={geos[edge]}
      >
        <meshStandardMaterial map={texture} />
      </mesh>
    );
  });

  return <>{meshes}</>;
}

function useUvs(texture: THREE.Texture, imageOffset: { x: number; y: number }) {
  return useMemo(() => {
    const preserveUV = calculatePreserveModeUV({
      imageWidthPx: texture.image.width,
      imageHeightPx: texture.image.height,
      imageOffset,
    });

    // Convert to the format expected by the component
    return {
      left: new Float32Array([
        preserveUV.left.uMin, preserveUV.left.vMax,  // 좌상
        preserveUV.left.uMax, preserveUV.left.vMax,  // 우상
        preserveUV.left.uMin, preserveUV.left.vMin,  // 좌하
        preserveUV.left.uMax, preserveUV.left.vMin,  // 우하
      ]),
      right: new Float32Array([
        preserveUV.right.uMin, preserveUV.right.vMax,
        preserveUV.right.uMax, preserveUV.right.vMax,
        preserveUV.right.uMin, preserveUV.right.vMin,
        preserveUV.right.uMax, preserveUV.right.vMin,
      ]),
      top: new Float32Array([
        preserveUV.top.uMin, preserveUV.top.vMax,
        preserveUV.top.uMax, preserveUV.top.vMax,
        preserveUV.top.uMin, preserveUV.top.vMin,
        preserveUV.top.uMax, preserveUV.top.vMin,
      ]),
      bottom: new Float32Array([
        preserveUV.bottom.uMin, preserveUV.bottom.vMax,
        preserveUV.bottom.uMax, preserveUV.bottom.vMax,
        preserveUV.bottom.uMin, preserveUV.bottom.vMin,
        preserveUV.bottom.uMax, preserveUV.bottom.vMin,
      ]),
    };
  }, [texture, imageOffset]);
}
