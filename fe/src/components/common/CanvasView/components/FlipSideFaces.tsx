import { useMemo } from "react";
import * as THREE from "three";
import { FACE_DIRECTIONS, SIDE_FACE_POSITIONS, SIDE_FACE_ROTATIONS, SIDE_FACE_SIZES } from "../types";
import { calculateFlipModeUV } from "../utils/uvCalculations";

export function FlipSideFaces({
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
    const flipUV = calculateFlipModeUV({
      imageWidthPx: texture.image.width,
      imageHeightPx: texture.image.height,
      imageOffset,
    });

    // Helper function to apply flip transformations
    function applyFlipUV(uv: { uMin: number; uMax: number; vMin: number; vMax: number; flipX?: boolean; flipY?: boolean }) {
      const { uMin, uMax, vMin, vMax, flipX, flipY } = uv;
      
      if (flipX && !flipY) {
        // X축 뒤집기 (좌우 바뀜)
        return new Float32Array([
          uMax, vMax,  // Vertex 0 (좌상) → 우상 UV
          uMin, vMax,  // Vertex 1 (우상) → 좌상 UV
          uMax, vMin,  // Vertex 2 (좌하) → 우하 UV
          uMin, vMin,  // Vertex 3 (우하) → 좌하 UV
        ]);
      } else if (!flipX && flipY) {
        // Y축 뒤집기 (상하 바뀜)
        return new Float32Array([
          uMin, vMin,  // Vertex 0 (좌상) → 좌하 UV
          uMax, vMin,  // Vertex 1 (우상) → 우하 UV
          uMin, vMax,  // Vertex 2 (좌하) → 좌상 UV
          uMax, vMax,  // Vertex 3 (우하) → 우상 UV
        ]);
      } else {
        // 뒤집기 없음 (기본)
        return new Float32Array([
          uMin, vMax,  // Vertex 0 (좌상)
          uMax, vMax,  // Vertex 1 (우상)
          uMin, vMin,  // Vertex 2 (좌하)
          uMax, vMin,  // Vertex 3 (우하)
        ]);
      }
    }

    return {
      left: applyFlipUV(flipUV.left),
      right: applyFlipUV(flipUV.right),
      top: applyFlipUV(flipUV.top),
      bottom: applyFlipUV(flipUV.bottom),
    };
  }, [texture, imageOffset]);
}
