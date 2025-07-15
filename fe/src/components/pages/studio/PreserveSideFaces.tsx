import { useMemo, useContext } from "react";
import * as THREE from "three";
import { lrtbs, positions, rotations, sizes } from "./types";
import { StudioContext } from "./StudioContext";
import { calculatePreserveModeUV } from "./utils/uvCalculations";

export function PreserveSideFaces() {
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
    const preserveUV = calculatePreserveModeUV({
      imageWidthPx: uploadedImage.texture.image.width,
      imageHeightPx: uploadedImage.texture.image.height,
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
  }, [uploadedImage, imageOffset]);
}
