import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
// import { useArtworks } from "@/hooks/useArtworks";
import { toast } from "sonner";
import { SimpleCanvasViewPlanes } from "@/components/common/SimpleCanvasViewPlanes";
import * as THREE from "three";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Upload } from "lucide-react";

// 심플한 스튜디오 상태
type SimpleStudioState = {
  uploadedImage: HTMLImageElement | undefined;
  imageDataUrl: string | undefined;
  uploadedFileName?: string;
  sideProcessingEnabled: boolean; // true: 살리기, false: 자르기
  imageOffset: { x: number; y: number }; // -1 ~ 1 범위
  rotation: { x: number; y: number };
};

const SimpleStudioContext = createContext<{
  state: SimpleStudioState;
  updateState: (updates: Partial<SimpleStudioState>) => void;
  handleImageUpload: (file: File) => void;
  handleSaveToArtworks: (title: string) => Promise<void>;
  handleClearWork: () => void;
  isSaving: boolean;
} | null>(null);

const useSimpleStudioContext = () => {
  const context = useContext(SimpleStudioContext);
  if (!context) {
    throw new Error("useSimpleStudioContext must be used within SimpleStudioContext");
  }
  return context;
};


// 카메라 각도 프리셋
const CAMERA_PRESETS = [
  { label: "정면", rotation: { x: 0, y: 0 } },
  { label: "우측", rotation: { x: 0, y: 25 } },
  { label: "좌측", rotation: { x: 0, y: -25 } },
  { label: "위에서", rotation: { x: 15, y: 0 } },
];

export default function SimpleStudioPage() {
  // const { saveArtwork, isSaving } = useArtworks();
  const isSaving = false;
  const saveArtwork = async (data: any) => {
    console.log("Save artwork:", data);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const [state, setState] = useState<SimpleStudioState>({
    uploadedImage: undefined,
    imageDataUrl: undefined,
    uploadedFileName: undefined,
    sideProcessingEnabled: false, // 기본값: 자르기
    imageOffset: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
  });

  // localStorage에서 이미지 로드
  useEffect(() => {
    const savedImageData = localStorage.getItem('simpleStudio_imageData');
    const savedFileName = localStorage.getItem('simpleStudio_fileName');
    
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

  const updateState = useCallback((updates: Partial<SimpleStudioState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          // localStorage에 저장
          localStorage.setItem('simpleStudio_imageData', dataUrl);
          localStorage.setItem('simpleStudio_fileName', file.name);
          
          updateState({
            uploadedImage: img,
            imageDataUrl: dataUrl,
            uploadedFileName: file.name,
            imageOffset: { x: 0, y: 0 }, // 리셋
          });
        };
      };
      reader.readAsDataURL(file);
    },
    [updateState]
  );

  const handleSaveToArtworks = useCallback(
    async (title: string) => {
      if (!state.uploadedImage || !state.imageDataUrl) {
        throw new Error("이미지가 없습니다");
      }

      // 새로운 방식에서는 UV 매핑으로 처리하므로 복잡한 계산 불필요
      await saveArtwork({
        title,
        imageDataUrl: state.imageDataUrl,
        settings: {
          dpi: 300, // 기본값 사용
          imageCenterXyInch: {
            x: state.imageOffset.x,
            y: state.imageOffset.y,
          },
          sideProcessing: {
            type: state.sideProcessingEnabled ? "flip" : "clip",
          },
          canvasBackgroundColor: "white",
        },
      });
    },
    [state, saveArtwork]
  );

  const handleClearWork = useCallback(() => {
    if (!confirm("정말 초기화하시겠습니까?")) {
      return;
    }
    setState({
      uploadedImage: undefined,
      imageDataUrl: undefined,
      uploadedFileName: undefined,
      sideProcessingEnabled: false,
      imageOffset: { x: 0, y: 0 },
      rotation: { x: 0, y: 0 },
    });
  }, []);

  return (
    <SimpleStudioContext.Provider
      value={{
        state,
        updateState,
        handleImageUpload,
        handleSaveToArtworks,
        handleClearWork,
        isSaving,
      }}
    >
      <div className="h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* 좌측: 캔버스 프리뷰 */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-100 to-gray-200 min-h-[400px] md:min-h-[600px]">
          <CanvasPreview />
        </div>

        {/* 우측: 컨트롤 패널 */}
        <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
          <ControlPanel />
        </div>
      </div>
    </SimpleStudioContext.Provider>
  );
}

function CanvasPreview() {
  const { state, handleImageUpload } = useSimpleStudioContext();
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);

  // 이미지가 변경될 때 텍스처 생성
  useEffect(() => {
    if (state.uploadedImage) {
      const texture = new THREE.Texture(state.uploadedImage);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      setImageTexture(texture);
      
      return () => {
        texture.dispose();
      };
    } else {
      setImageTexture(null);
    }
  }, [state.uploadedImage]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!state.uploadedImage) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              여기에 사진을 드래그 앤 드롭 하거나<br />
              클릭하여 업로드하세요
            </p>
          </div>
        </label>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <SimpleCanvasViewPlanes
        imageTexture={imageTexture}
        rotation={state.rotation}
        imageOffset={state.imageOffset}
        sideProcessingEnabled={state.sideProcessingEnabled}
      />
    </div>
  );
}

function ControlPanel() {
  const {
    state,
    updateState,
    handleImageUpload,
    handleSaveToArtworks,
    handleClearWork,
    isSaving,
  } = useSimpleStudioContext();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!state.uploadedFileName) return;
    
    const title = state.uploadedFileName.replace(/\.[^/.]+$/, "");
    try {
      await handleSaveToArtworks(title);
      toast.success("작품이 저장되었습니다.");
    } catch (error) {
      console.error("Failed to save artwork:", error);
      toast.error("작품 저장에 실패했습니다.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">

      {/* 이미지 변경 */}
      {state.uploadedImage && (
        <div>
          <Label className="text-sm font-medium mb-2 block">이미지 변경</Label>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
            />
            <Button variant="outline" className="w-full" type="button">
              <Upload className="w-4 h-4 mr-2" />
              다른 이미지 선택
            </Button>
          </label>
        </div>
      )}

      {/* 카메라 각도 */}
      <div>
        <Label className="text-sm font-medium mb-3 block">카메라 각도</Label>
        <div className="grid grid-cols-2 gap-2">
          {CAMERA_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={
                state.rotation.x === preset.rotation.x &&
                state.rotation.y === preset.rotation.y
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => updateState({ rotation: preset.rotation })}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 액자 옆면 처리 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="side-processing" className="text-sm font-medium">
            액자 옆면 처리
          </Label>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">자르기</span>
            <Switch
              id="side-processing"
              checked={state.sideProcessingEnabled}
              onCheckedChange={(checked) =>
                updateState({ sideProcessingEnabled: checked })
              }
            />
            <span className="text-sm text-gray-600">살리기</span>
          </div>
        </div>
      </div>

      {/* 이미지 위치 조정 */}
      {state.uploadedImage && (
        <div className="space-y-4">
          <Label className="text-sm font-medium block">이미지 위치 조정</Label>
          
          {(() => {
            // 이미지와 캔버스의 비율을 확인하여 이동 가능한 방향 결정
            const imageAspect = state.uploadedImage.width / state.uploadedImage.height;
            const canvasAspect = 4 / 6; // 100mm / 150mm
            const isHorizontalMovable = imageAspect > canvasAspect;
            
            if (isHorizontalMovable) {
              // 가로로 긴 이미지 - 좌우 이동만 가능
              return (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-600">좌우 이동</span>
                    <span className="text-xs text-gray-600">
                      {(state.imageOffset.x * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[state.imageOffset.x]}
                    onValueChange={([x]) =>
                      updateState({ imageOffset: { x, y: 0 } })
                    }
                    min={-1}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>
              );
            } else {
              // 세로로 긴 이미지 - 상하 이동만 가능
              return (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-600">상하 이동</span>
                    <span className="text-xs text-gray-600">
                      {(state.imageOffset.y * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[state.imageOffset.y]}
                    onValueChange={([y]) =>
                      updateState({ imageOffset: { x: 0, y } })
                    }
                    min={-1}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="pt-auto mt-auto space-y-3">
        {state.uploadedImage && (
          <Button
            onClick={handleClearWork}
            variant="outline"
            className="w-full"
          >
            초기화
          </Button>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={() => navigate({ to: "/artworks" })}
            variant="outline"
            className="flex-1"
          >
            내 작품
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!state.uploadedImage || isSaving}
            className="flex-1"
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}