import { useState, useCallback, createContext, useEffect } from "react";
import { toast } from "sonner";
import { SideMode } from "../../../../../shared/types";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/config";
import { CAMERA_PRESETS } from "./types";
import { isPsdFile } from "@/utils/isPsdFile";

export const StudioContext = createContext<{
  state: State;
  updateState: (func: (prev: State) => State | void) => void;
  handleImageUpload: (file: File) => void;
  handleSave: () => Promise<void>;
  cycleCameraPreset: (direction: "next" | "prev") => void;
}>(null!);

export type ImageState = {
  originalFile: File;
  textureFileState:
    | {
        type: "converting";
      }
    | {
        type: "loaded";
        file: File;
      };
  isImageChanged: boolean;
};

type State = {
  imageState: ImageState;
  title: string;
  sideMode: SideMode;
  imageOffset: { x: number; y: number };
  rotation: { x: number; y: number };
  isSaving: boolean;
  artworkId: string | undefined;
};

export function StudioContextProvider({
  imageState,
  children,
}: {
  imageState: ImageState;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<State>({
    imageState,
    title: "",
    sideMode: SideMode.CLIP,
    imageOffset: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    isSaving: false,
    artworkId: undefined,
  });

  // 상태 업데이트
  const updateState = useCallback((func: (state: State) => void) => {
    setState((state) => {
      func(state);
      return { ...state };
    });
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(
    function loadTexture() {
      console.log("loadTexture");
      const file = state.imageState.originalFile;
      console.log("isPsdFile(file)", isPsdFile(file));
      if (!isPsdFile(file)) {
        return updateState((state) => {
          state.imageState.textureFileState = {
            type: "loaded",
            file: file,
          };
        });
      }

      (async () => {
        try {
          // 1. PSD 업로드용 presigned URL 받기
          const psdUploadResponse = await api.getPsdToJpgConvertPutUrl({
            contentLength: file.size,
          });

          if (!psdUploadResponse.ok) {
            throw new Error(psdUploadResponse.reason);
          }

          // 2. PSD 파일을 S3에 업로드
          const uploadResponse = await fetch(psdUploadResponse.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/x-photoshop",
            },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload PSD file");
          }

          // 3. PSD → JPG 변환 요청
          const convertResponse = await api.convertPsdToJpg({
            conversionId: psdUploadResponse.conversionId,
          });

          if (!convertResponse.ok) {
            throw new Error("Failed to convert PSD file");
          }

          toast.success("PSD 파일이 성공적으로 변환되었습니다");

          // 4. 변환된 JPG 다운로드해서 텍스처로 사용
          const psdBuffer = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest("SHA-256", psdBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hash = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          // 변환된 JPG 다운로드
          const jpgUrl = getImageUrl(`psd-converted/${hash}.jpg`);
          const jpgResponse = await fetch(jpgUrl);
          if (!jpgResponse.ok) {
            throw new Error("Failed to fetch converted JPG file");
          }

          const jpgBlob = await jpgResponse.blob();
          const jpgFile = new File(
            [jpgBlob],
            file.name.replace(/\.psd$/i, ".jpg"),
            {
              type: "image/jpeg",
            }
          );

          updateState((state) => {
            state.imageState.textureFileState = {
              type: "loaded",
              file: jpgFile,
            };
          });
        } catch (error) {
          console.error("PSD conversion failed:", error);
          toast.error("PSD 파일 변환에 실패했습니다. 다시 시도해주세요.");
        }
      })();
    },
    [state.imageState.originalFile, updateState]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      updateState((state) => {
        state.imageState.originalFile = file;
        state.imageState.isImageChanged = true;
      });

      if (isPsdFile(file)) {
        updateState((state) => {
          state.imageState.textureFileState = {
            type: "converting",
          };
        });
      }
    },
    [updateState]
  );

  const handleSave = useCallback(async () => {
    if (!state.imageState || isSaving) {
      return;
    }

    const { originalFile, isImageChanged } = state.imageState;

    setIsSaving(true);
    try {
      const artworkId = await (async () => {
        if (state.artworkId) {
          const updateRes = await api.updateArtwork({
            artworkId: state.artworkId,
            title: state.title,
            sideMode: state.sideMode,
            imageOffset: state.imageOffset,
          });
          if (!updateRes.ok) {
            throw new Error(updateRes.reason);
          }
          return state.artworkId;
        }

        const newArtworkRes = await api.newArtwork({
          title: state.title,
          sideMode: state.sideMode,
          imageOffset: state.imageOffset,
        });
        if (!newArtworkRes.ok) {
          throw new Error(newArtworkRes.reason);
        }
        const artworkId = newArtworkRes.artworkId;

        updateState((state) => {
          state.artworkId = artworkId;
        });
        return artworkId;
      })();

      if (isImageChanged) {
        const putUrlResponse = await api.getArtworkImagePutUrl({
          artworkId,
          contentLength: originalFile.size,
        });
        if (!putUrlResponse.ok) {
          throw new Error(putUrlResponse.reason);
        }

        const putImageRes = await fetch(putUrlResponse.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": originalFile.type,
          },
          body: originalFile,
        });
        if (!putImageRes.ok) {
          throw new Error(await putImageRes.text());
        }

        updateState((state) => {
          state.imageState.isImageChanged = false;
        });
      }

      toast.success("작품이 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save artwork:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      toast.error(`작품 저장에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    state.title,
    state.sideMode,
    state.imageOffset,
    state.artworkId,
    state.imageState,
    updateState,
  ]);

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

      updateState((state) => {
        state.rotation = CAMERA_PRESETS[nextIndex].rotation;
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
        cycleCameraPreset,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}
