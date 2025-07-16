import { useState, useCallback, useEffect, useRef, createContext } from "react";
import { toast } from "sonner";
import { CAMERA_PRESETS, CAMERA_ROTATION_LIMITS } from "./types";
import { SideMode } from "../../../../../shared/types";
import { api } from "@/lib/api";

export const StudioContext = createContext<{
  state: State;
  updateState: (func: (prev: State) => State | void) => void;
  handleImageUpload: (file: File) => void;
  handleSave: () => Promise<void>;
  onDragOver: (e: React.DragEvent) => void;
  onDragDrop: (e: React.DragEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  cycleCameraPreset: (direction: "next" | "prev") => void;
}>(null!);

type State = {
  uploadedImage: File | undefined;
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
  rotation: { x: number; y: number };
  isSaving: boolean;
  artworkId: string | undefined;
  isImageChanged: boolean;
};

export function StudioContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>({
    uploadedImage: undefined,
    sideMode: SideMode.CLIP,
    imageOffset: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    isSaving: false,
    artworkId: undefined,
    isImageChanged: false,
  });

  // 상태 업데이트
  const updateState = useCallback((func: (prev: State) => State | void) => {
    setState((prev) => {
      const next = func(prev);
      if (next) {
        return next;
      }
      return { ...prev };
    });
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });


  const handleImageUpload = useCallback(
    (file: File) => {
      updateState((prev) => ({
        ...prev,
        uploadedImage: file,
        isImageChanged: true,
      }));
    },
    [updateState]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) {
      return;
    }
    e.preventDefault();

    const deltaX = e.clientX - lastMousePosition.current.x;
    const deltaY = e.clientY - lastMousePosition.current.y;

    updateState((prev) => {
      prev.rotation = {
        x: Math.max(
          -CAMERA_ROTATION_LIMITS.maxXRotation,
          Math.min(
            CAMERA_ROTATION_LIMITS.maxXRotation,
            prev.rotation.x + deltaY * 0.5
          )
        ),
        y: Math.max(
          -CAMERA_ROTATION_LIMITS.maxYRotation,
          Math.min(
            CAMERA_ROTATION_LIMITS.maxYRotation,
            prev.rotation.y + deltaX * 0.5
          )
        ),
      };
    });

    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSave = useCallback(async () => {
    if (!state.uploadedImage || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const title = state.uploadedImage.name.replace(/\.[^/.]+$/, "");
      let artworkId = state.artworkId;

      if (!artworkId) {
        const newArtworkRes = await api.newArtwork({
          title,
          sideMode: state.sideMode,
          imageOffset: state.imageOffset,
        });
        if (!newArtworkRes.ok) {
          throw new Error(newArtworkRes.reason);
        }
        artworkId = newArtworkRes.artworkId;

        updateState((prev) => ({
          ...prev,
          artworkId,
        }));
      } else {
        const updateRes = await api.updateArtwork({
          artworkId,
          title,
          sideMode: state.sideMode,
          imageOffset: state.imageOffset,
        });
        if (!updateRes.ok) {
          throw new Error(updateRes.reason);
        }
      }

      if (state.isImageChanged) {
        const putUrlResponse = await api.getArtworkImagePutUrl({
          artworkId,
          contentLength: state.uploadedImage.size,
        });
        if (!putUrlResponse.ok) {
          throw new Error(putUrlResponse.reason);
        }

        const putImageRes = await fetch(putUrlResponse.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": state.uploadedImage.type,
          },
          body: state.uploadedImage,
        });
        if (!putImageRes.ok) {
          throw new Error(await putImageRes.text());
        }

        updateState((prev) => ({
          ...prev,
          isImageChanged: false,
        }));
      }

      toast.success("작품이 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save artwork:", error);
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      toast.error(`작품 저장에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [state.uploadedImage, isSaving, state.sideMode, state.imageOffset, state.artworkId, state.isImageChanged, updateState]);

  const cycleCameraPreset = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = CAMERA_PRESETS.findIndex(
        (preset) =>
          preset.rotation.x === state.rotation.x &&
          preset.rotation.y === state.rotation.y
      );

      const nextIndex =
        direction === "next"
          ? (currentIndex + 1) % CAMERA_PRESETS.length
          : currentIndex === 0
            ? CAMERA_PRESETS.length - 1
            : currentIndex - 1;

      updateState((prev) => {
        prev.rotation = CAMERA_PRESETS[nextIndex].rotation;
      });
    },
    [state.rotation, updateState]
  );

  return (
    <StudioContext.Provider
      value={{
        state,
        updateState,
        handleImageUpload,
        handleSave,
        onDragDrop,
        onDragOver,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        cycleCameraPreset,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}
