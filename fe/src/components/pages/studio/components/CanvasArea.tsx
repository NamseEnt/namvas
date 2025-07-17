import { useContext, useRef, type ReactNode } from "react";
import { StudioContext } from "../StudioContext";
import styles from "./CanvasArea.module.css";
import { CAMERA_ROTATION_LIMITS } from "../types";

export function CanvasArea({ children }: { children: ReactNode }) {
  const { updateState } = useContext(StudioContext);
  const dragging = useRef<{ x: number; y: number }>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) {
      return;
    }
    e.preventDefault();

    const deltaX = e.clientX - dragging.current.x;
    const deltaY = e.clientY - dragging.current.y;

    updateState((state) => {
      state.rotation = {
        x: Math.max(
          -CAMERA_ROTATION_LIMITS.maxXRotation,
          Math.min(
            CAMERA_ROTATION_LIMITS.maxXRotation,
            state.rotation.x + deltaY * 0.5
          )
        ),
        y: Math.max(
          -CAMERA_ROTATION_LIMITS.maxYRotation,
          Math.min(
            CAMERA_ROTATION_LIMITS.maxYRotation,
            state.rotation.y + deltaX * 0.5
          )
        ),
      };
    });

    dragging.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
