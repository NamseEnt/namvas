import * as THREE from "three";
import { Planes } from "../Planes";
import { SideMode } from "../types";

interface CanvasAreaProps {
  imageTexture: THREE.Texture | undefined;
  rotation: { x: number; y: number };
  imageOffset: { x: number; y: number };
  sideMode: SideMode;
  canvasInteraction: {
    handlePointerDown: (e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: (e: React.PointerEvent) => void;
  };
  dragAndDrop: {
    handleDrop: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
  };
  className?: string;
}

export function CanvasArea({
  imageTexture,
  rotation,
  imageOffset,
  sideMode,
  canvasInteraction,
  dragAndDrop,
  className = "",
}: CanvasAreaProps) {
  return (
    <div
      className={`
        w-full h-full 
        cursor-grab active:cursor-grabbing
        bg-gradient-to-br from-gray-100 to-gray-200
        rounded-lg lg:rounded-none
        shadow-lg lg:shadow-none
        ${className}
      `}
      onDrop={dragAndDrop.handleDrop}
      onDragOver={dragAndDrop.handleDragOver}
      onPointerDown={canvasInteraction.handlePointerDown}
      onPointerMove={canvasInteraction.handlePointerMove}
      onPointerUp={canvasInteraction.handlePointerUp}
      onPointerLeave={canvasInteraction.handlePointerUp}
    >
      {imageTexture && (
        <Planes
          imageTexture={imageTexture}
          rotation={rotation}
          imageOffset={imageOffset}
          sideMode={sideMode}
        />
      )}
    </div>
  );
}