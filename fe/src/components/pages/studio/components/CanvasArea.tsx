import { useContext, type ReactNode } from "react";
import { StudioContext } from "../StudioContext";
import styles from "./CanvasArea.module.css";

export function CanvasArea({ children }: { children: ReactNode }) {
  const { onPointerDown, onPointerMove, onPointerUp } =
    useContext(StudioContext);

  return (
    <div
      className={`
        w-full h-full 
        cursor-grab active:cursor-grabbing
        ${styles.checkerboard}
        rounded-lg lg:rounded-none
        shadow-lg lg:shadow-none
        relative
        overflow-hidden
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
