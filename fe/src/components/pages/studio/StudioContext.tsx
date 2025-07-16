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

  useEffect(function loadSavedImage() {
    const savedImageString = localStorage.getItem("Studio_imageFile");
    if (!savedImageString) {
      return;
    }
    const savedImageData = JSON.parse(savedImageString) as {
      name: string;
      type: string;
      lastModified: number;
      dataUrl: string;
    };

    (async () => {
      const response = await fetch(savedImageData.dataUrl);
      const blob = await response.blob();

      const file = new File([blob], savedImageData.name, {
        type: savedImageData.type,
        lastModified: savedImageData.lastModified,
      });

      setState((prev) => ({
        ...prev,
        uploadedImage: file,
      }));
    })();
  }, []);

  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        localStorage.setItem(
          "Studio_imageFile",
          JSON.stringify({
            name: file.name,
            type: file.type,
            lastModified: file.lastModified,
            dataUrl,
          })
        );

        updateState((prev) => {
          prev.uploadedImage = file;
        });
      };
      reader.readAsDataURL(file);
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
      const newArtworkRes = await api.newArtwork({
        title,
        sideMode: state.sideMode,
        imageOffset: state.imageOffset,
      });
      if (!newArtworkRes.ok) {
        throw new Error(newArtworkRes.reason);
      }

      const putUrlResponse = await api.getArtworkImagePutUrl({
        artworkId: newArtworkRes.artworkId,
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
    } catch (error) {
      console.error("Failed to save artwork:", error);
      toast.error("작품 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [state.uploadedImage, isSaving, state.sideMode, state.imageOffset]);

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
