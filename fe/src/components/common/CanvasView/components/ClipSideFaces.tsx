import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { FACE_DIRECTIONS, SIDE_FACE_POSITIONS, SIDE_FACE_ROTATIONS, SIDE_FACE_SIZES } from "../types";

export function ClipSideFaces() {
  const canvasTexture = useLoader(THREE.TextureLoader, "/canvas-texture.jpg");
  
  // 각 면의 geometry 생성
  const geos = useMemo(() => {
    return FACE_DIRECTIONS.reduce((acc, edge) => {
      acc[edge] = new THREE.PlaneGeometry(SIDE_FACE_SIZES[edge][0], SIDE_FACE_SIZES[edge][1]);
      return acc;
    }, {} as Record<(typeof FACE_DIRECTIONS)[number], THREE.PlaneGeometry>);
  }, []);

  const meshes = FACE_DIRECTIONS.map((edge) => {
    return (
      <mesh 
        key={edge} 
        position={SIDE_FACE_POSITIONS[edge]} 
        rotation={SIDE_FACE_ROTATIONS[edge]}
        geometry={geos[edge]}
      >
        <meshStandardMaterial map={canvasTexture} />
      </mesh>
    );
  });

  return <>{meshes}</>;
}
