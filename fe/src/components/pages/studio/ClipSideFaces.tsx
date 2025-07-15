import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { lrtbs, positions, rotations, sizes } from "./types";

export function ClipSideFaces() {
  const canvasTexture = useLoader(THREE.TextureLoader, "/canvas-texture.jpg");
  
  // 각 면의 geometry 생성
  const geos = useMemo(() => {
    return lrtbs.reduce((acc, edge) => {
      acc[edge] = new THREE.PlaneGeometry(sizes[edge][0], sizes[edge][1]);
      return acc;
    }, {} as Record<(typeof lrtbs)[number], THREE.PlaneGeometry>);
  }, []);

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
