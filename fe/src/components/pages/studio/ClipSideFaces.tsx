import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { lrtbs, positions, rotations } from "./types";

export function ClipSideFaces() {
  const canvasTexture = useLoader(THREE.TextureLoader, "/canvas-texture.jpg");

  const meshes = lrtbs.map((edge) => {
    return (
      <mesh key={edge} position={positions[edge]} rotation={rotations[edge]}>
        <meshStandardMaterial map={canvasTexture} />
      </mesh>
    );
  });

  return <>{meshes}</>;
}
