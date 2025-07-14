import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import * as THREE from "three";
import { SideMode } from "../types";

type StudioState = {
  uploadedImage: HTMLImageElement | undefined;
  imageDataUrl: string | undefined;
  uploadedFileName?: string;
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
  rotation: { x: number; y: number };
};

const CAMERA_PRESETS = [
  { label: "정면", rotation: { x: 0, y: 0 } },
  { label: "우측", rotation: { x: 0, y: 25 } },
  { label: "좌측", rotation: { x: 0, y: -25 } },
  { label: "위에서", rotation: { x: 15, y: 0 } },
];

export function useStudioLogic() {
  const navigate = useNavigate();
  const [state, setState] = useState<StudioState>({
    uploadedImage: undefined,
    imageDataUrl: undefined,
    uploadedFileName: undefined,
    sideMode: SideMode.CLIP,
    imageOffset: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
  });

  const [isSaving, setIsSaving] = useState(false);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // 초기화: localStorage에서 이미지 로드
  useEffect(function loadSavedImage() {
    const savedImageData = localStorage.getItem("Studio_imageData");
    const savedFileName = localStorage.getItem("Studio_fileName");

    if (savedImageData && savedFileName) {
      const img = new Image();
      img.src = savedImageData;
      img.onload = () => {
        setState(prev => ({
          ...prev,
          uploadedImage: img,
          imageDataUrl: savedImageData,
          uploadedFileName: savedFileName,
        }));
      };
    }
  }, []);

  // 이미지 텍스처 생성
  const imageTexture = useMemo(() => {
    if (!state.uploadedImage) return undefined;
    const texture = new THREE.Texture(state.uploadedImage);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, [state.uploadedImage]);

  // 상태 업데이트
  const updateState = useCallback((updates: Partial<StudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 이미지 업로드
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        localStorage.setItem("Studio_imageData", dataUrl);
        localStorage.setItem("Studio_fileName", file.name);
        updateState({
          uploadedImage: img,
          imageDataUrl: dataUrl,
          uploadedFileName: file.name,
          imageOffset: { x: 0, y: 0 },
        });
      };
    };
    reader.readAsDataURL(file);
  }, [updateState]);

  // 캔버스 인터랙션
  const canvasInteraction = {
    handlePointerDown: (e: React.PointerEvent) => {
      isDragging.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    handlePointerMove: (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      
      const deltaX = e.clientX - lastMousePosition.current.x;
      const deltaY = e.clientY - lastMousePosition.current.y;
      
      updateState({
        rotation: {
          x: Math.max(-30, Math.min(30, state.rotation.x - deltaY * 0.5)),
          y: state.rotation.y + deltaX * 0.5,
        },
      });
      
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    },
    handlePointerUp: (e: React.PointerEvent) => {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
  };

  // 드래그 앤 드롭
  const dragAndDrop = {
    handleDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        handleImageUpload(files[0]);
      }
    },
    handleDragOver: (e: React.DragEvent) => {
      e.preventDefault();
    },
  };

  // 저장
  const handleSave = useCallback(async () => {
    if (!state.uploadedFileName) return;
    
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
  }, [state.uploadedFileName]);

  // 카메라 프리셋 순환 (모바일용)
  const cycleCameraPreset = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = CAMERA_PRESETS.findIndex(
      preset => preset.rotation.x === state.rotation.x && preset.rotation.y === state.rotation.y
    );
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % CAMERA_PRESETS.length;
    } else {
      nextIndex = currentIndex === 0 ? CAMERA_PRESETS.length - 1 : currentIndex - 1;
    }
    
    updateState({ rotation: CAMERA_PRESETS[nextIndex].rotation });
  }, [state.rotation, updateState]);

  // 이미지 위치 조정 정보
  const imagePositionInfo = useMemo(() => {
    if (!state.uploadedImage) return { isHorizontalMovable: false, canMove: false };
    
    const imageAspect = state.uploadedImage.width / state.uploadedImage.height;
    const canvasAspect = 4 / 6; // 100mm / 150mm
    const isHorizontalMovable = imageAspect > canvasAspect;
    
    return { isHorizontalMovable, canMove: true };
  }, [state.uploadedImage]);

  return {
    state,
    isSaving,
    imageTexture,
    CAMERA_PRESETS,
    updateState,
    handleImageUpload,
    handleSave,
    canvasInteraction,
    dragAndDrop,
    cycleCameraPreset,
    imagePositionInfo,
    navigate,
  };
}