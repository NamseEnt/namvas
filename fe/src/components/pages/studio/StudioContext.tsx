import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  createContext,
} from "react";
import { toast } from "sonner";
import * as THREE from "three";
import { CAMERA_PRESETS, SideMode } from "./types";
import { getUvBounds } from "./getUvBounds";

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
  imagePositionInfo: {
    isHorizontalMovable: boolean;
    canMove: boolean;
  };
  cycleCameraPreset: (direction: "next" | "prev") => void;
}>(null!);

type State = {
  uploadedImage:
    | {
        texture: THREE.Texture;
        name: string;
        uvBounds: {
          left: number;
          right: number;
          bottom: number;
          top: number;
        };
      }
    | undefined;
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
    const savedImageData = localStorage.getItem("Studio_imageData");
    const savedFileName = localStorage.getItem("Studio_fileName");

    if (savedImageData && savedFileName) {
      const img = new Image();
      img.src = savedImageData;
      img.onload = () => {
        const uvBounds = getUvBounds({
          imageWh: {
            width: img.width,
            height: img.height,
          },
          imageOffset: { x: 0, y: 0 },
        });

        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;

        setState((prev) => ({
          ...prev,
          uploadedImage: {
            texture,
            name: savedFileName,
            uvBounds,
          },
        }));
      };
    }
  }, []);

  useEffect(
    function updateUvBounds() {
      if (!state.uploadedImage) {
        return;
      }
      const uvBounds = getUvBounds({
        imageWh: {
          width: state.uploadedImage.texture.image.width,
          height: state.uploadedImage.texture.image.height,
        },
        imageOffset: state.imageOffset,
      });

      updateState((prev) => {
        if (prev.uploadedImage) {
          prev.uploadedImage.uvBounds = uvBounds;
        }
        return prev;
      });
    },
    [state.uploadedImage, state.imageOffset, updateState]
  );

  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          localStorage.setItem("Studio_imageData", dataUrl);
          localStorage.setItem("Studio_fileName", file.name);

          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;

          updateState((prev) => {
            prev.uploadedImage = {
              texture,
              name: file.name,
              uvBounds: getUvBounds({
                imageWh: {
                  width: img.width,
                  height: img.height,
                },
                imageOffset: state.imageOffset,
              }),
            };
          });
        };
      };
      reader.readAsDataURL(file);
    },
    [state.imageOffset, updateState]
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
        x: Math.max(-30, Math.min(30, prev.rotation.x + deltaY * 0.5)),
        y: prev.rotation.y + deltaX * 0.5,
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
      // const title = state.uploadedFileName.replace(/\.[^/.]+$/, "");
      // await handleSaveToArtworks(title); // 실제 구현 대기
      throw new Error("Not implemented");
    } catch (error) {
      console.error("Failed to save artwork:", error);
      toast.error("작품 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [state.uploadedImage, isSaving]);

  const cycleCameraPreset = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = CAMERA_PRESETS.findIndex(
        (preset) =>
          preset.rotation.x === state.rotation.x &&
          preset.rotation.y === state.rotation.y
      );

      let nextIndex;
      if (direction === "next") {
        nextIndex = (currentIndex + 1) % CAMERA_PRESETS.length;
      } else {
        nextIndex =
          currentIndex === 0 ? CAMERA_PRESETS.length - 1 : currentIndex - 1;
      }

      updateState((prev) => {
        prev.rotation = CAMERA_PRESETS[nextIndex].rotation;
      });
    },
    [state.rotation, updateState]
  );

  const imagePositionInfo = useMemo(() => {
    if (!state.uploadedImage) {
      return { isHorizontalMovable: false, canMove: false };
    }

    const imageAspect =
      state.uploadedImage.texture.image.width /
      state.uploadedImage.texture.image.height;
    const canvasAspect = 4 / 6; // 100mm / 150mm
    const isHorizontalMovable = imageAspect > canvasAspect;

    return { isHorizontalMovable, canMove: true };
  }, [state.uploadedImage]);

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
        imagePositionInfo,
        cycleCameraPreset,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}
