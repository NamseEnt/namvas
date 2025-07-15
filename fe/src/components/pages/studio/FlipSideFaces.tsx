import { useMemo, useContext } from "react";
import * as THREE from "three";
import { lrtbs, positions, rotations, sizes } from "./types";
import { StudioContext } from "./StudioContext";
import { calculateFlipModeUV } from "./utils/uvCalculations";

export function FlipSideFaces() {
  const {
    state: { uploadedImage },
  } = useContext(StudioContext);
  
  if (!uploadedImage) {
    throw "unreachable";
  }

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
        <meshStandardMaterial map={uploadedImage.texture} />
      </mesh>
    );
  });

  return <>{meshes}</>;
}

function useUvs() {
  const {
    state: { uploadedImage, imageOffset },
  } = useContext(StudioContext);
  
  if (!uploadedImage) {
    throw "unreachable";
  }

  return useMemo(() => {
    const flipUV = calculateFlipModeUV({
      imageWidthPx: uploadedImage.texture.image.width,
      imageHeightPx: uploadedImage.texture.image.height,
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
  }, [uploadedImage, imageOffset]);
}
