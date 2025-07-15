import { useContext, type ReactNode } from "react";
import { StudioContext } from "../StudioContext";

export function CanvasArea({ children }: { children: ReactNode }) {
  const { onPointerDown, onPointerMove, onPointerUp } =
    useContext(StudioContext);
  return (
    <div
      className={`
        w-full h-full 
        cursor-grab active:cursor-grabbing
        bg-gradient-to-br from-gray-100 to-gray-200
        rounded-lg lg:rounded-none
        shadow-lg lg:shadow-none
      `}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {children}
    </div>
  );
}
