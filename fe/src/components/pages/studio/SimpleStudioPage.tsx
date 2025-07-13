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
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Upload } from "lucide-react";
import { useRef } from "react";

// 옆면 처리 모드
enum SideMode {
  CLIP = "clip",     // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip"      // 뒤집기
}

// 심플한 스튜디오 상태
type SimpleStudioState = {
  uploadedImage: HTMLImageElement | undefined;
  imageDataUrl: string | undefined;
  uploadedFileName?: string;
  sideMode: SideMode;
  imageOffset: { x: number; y: number }; // -1 ~ 1 범위
  rotation: { x: number; y: number };
};

const SimpleStudioContext = createContext<{
  state: SimpleStudioState;
  updateState: (updates: Partial<SimpleStudioState>) => void;
  handleImageUpload: (file: File) => void;
  handleSaveToArtworks: (title: string) => Promise<void>;
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

// 공통 컴포넌트들
function UploadPromptBox() {
  const { handleImageUpload } = useSimpleStudioContext();
  
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
  
  return (
    <label 
      className="cursor-pointer w-full max-w-sm"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
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
  );
}

function SideControl() {
  const { state, updateState } = useSimpleStudioContext();
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">옆면</span>
      <div className="h-4 w-px bg-gray-300" />
      <ToggleGroup 
        type="single" 
        value={state.sideMode} 
        onValueChange={(value) => value && updateState({ sideMode: value as SideMode })}
        className="flex"
      >
        <ToggleGroupItem value={SideMode.CLIP} size="sm" className="text-xs">
          자르기
        </ToggleGroupItem>
        <ToggleGroupItem value={SideMode.PRESERVE} size="sm" className="text-xs">
          살리기
        </ToggleGroupItem>
        <ToggleGroupItem value={SideMode.FLIP} size="sm" className="text-xs">
          뒤집기
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function CameraControl({ variant = "buttons" }: { variant?: "buttons" | "arrows" }) {
  const { state, updateState } = useSimpleStudioContext();
  
  const handleCameraNext = () => {
    const currentIndex = CAMERA_PRESETS.findIndex(
      preset => preset.rotation.x === state.rotation.x && preset.rotation.y === state.rotation.y
    );
    const nextIndex = (currentIndex + 1) % CAMERA_PRESETS.length;
    updateState({ rotation: CAMERA_PRESETS[nextIndex].rotation });
  };

  const handleCameraPrev = () => {
    const currentIndex = CAMERA_PRESETS.findIndex(
      preset => preset.rotation.x === state.rotation.x && preset.rotation.y === state.rotation.y
    );
    const prevIndex = currentIndex === 0 ? CAMERA_PRESETS.length - 1 : currentIndex - 1;
    updateState({ rotation: CAMERA_PRESETS[prevIndex].rotation });
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">카메라</span>
      <div className="h-4 w-px bg-gray-300" />
      {variant === "buttons" ? (
        <div className="grid grid-cols-2 gap-2 flex-1">
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
      ) : (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCameraPrev}
            className="w-12"
          >
            ◀
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCameraNext}
            className="w-12"
          >
            ▶
          </Button>
        </div>
      )}
    </div>
  );
}

function PositionControl({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { state, updateState } = useSimpleStudioContext();
  
  if (!state.uploadedImage) return null;
  
  const imageAspect = state.uploadedImage.width / state.uploadedImage.height;
  const canvasAspect = 4 / 6;
  
  // 살리기 모드에서는 전체 캔버스 기준으로 계산
  let effectiveCanvasAspect = canvasAspect;
  if (state.sideMode === SideMode.PRESERVE) {
    // 옆면을 포함한 전체 캔버스 비율
    const w = 0.1; // 100mm
    const h = 0.15; // 150mm
    const t = 0.006; // 6mm
    effectiveCanvasAspect = (w + 2 * t) / (h + 2 * t);
  }
  
  const isHorizontalMovable = imageAspect > effectiveCanvasAspect;
  const isFullyFitted = Math.abs(imageAspect - effectiveCanvasAspect) < 0.01; // 거의 같은 비율
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">이동</span>
      <div className="h-4 w-px bg-gray-300" />
      <Slider
        value={[isHorizontalMovable ? state.imageOffset.x : state.imageOffset.y]}
        onValueChange={([value]) => {
          updateState({ 
            imageOffset: isHorizontalMovable 
              ? { x: value, y: 0 } 
              : { x: 0, y: value }
          });
        }}
        min={-1}
        max={1}
        step={0.01}
        disabled={isFullyFitted}
        className={compact ? "w-64" : "flex-1"}
      />
    </div>
  );
}

function ImageChangeButton({ showLabel = false }: { showLabel?: boolean }) {
  const { handleImageUpload } = useSimpleStudioContext();
  
  return (
    <label className="cursor-pointer">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        className="hidden"
      />
      <Button 
        variant="outline" 
        size="sm" 
        type="button"
        className={showLabel ? "w-full" : ""}
      >
        <Upload className="w-4 h-4" />
        {showLabel && <span className="ml-2">다른 이미지 선택</span>}
      </Button>
    </label>
  );
}

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
    sideMode: SideMode.CLIP, // 기본값: 자르기
    imageOffset: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
  });

  const [isMobile, setIsMobile] = useState(false);

  // localStorage에서 이미지 로드 및 모바일 감지
  useEffect(() => {
    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // localStorage에서 이미지 로드
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

    return () => window.removeEventListener('resize', checkMobile);
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
            type: state.sideMode,
          },
          canvasBackgroundColor: "white",
        },
      });
    },
    [state, saveArtwork]
  );


  return (
    <SimpleStudioContext.Provider
      value={{
        state,
        updateState,
        handleImageUpload,
        handleSaveToArtworks,
        isSaving,
      }}
    >
      {isMobile ? (
        // 모바일 레이아웃
        <MobileLayout />
      ) : (
        // 데스크톱 레이아웃
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
      )}
    </SimpleStudioContext.Provider>
  );
}

function CanvasPreview() {
  const { state, updateState, handleImageUpload } = useSimpleStudioContext();
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

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

  // 마우스/터치 이벤트 핸들러
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault(); // 드래그 이벤트와의 충돌 방지

    const deltaX = e.clientX - lastMousePosition.current.x;
    const deltaY = e.clientY - lastMousePosition.current.y;

    updateState({
      rotation: {
        x: Math.max(-30, Math.min(30, state.rotation.x + deltaY * 0.5)),
        y: Math.max(-80, Math.min(80, state.rotation.y + deltaX * 0.5)),
      },
    });

    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!state.uploadedImage) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <UploadPromptBox />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <SimpleCanvasViewPlanes
        imageTexture={imageTexture}
        rotation={state.rotation}
        imageOffset={state.imageOffset}
        sideMode={state.sideMode}
      />
    </div>
  );
}

function ControlPanel() {
  const {
    state,
    handleSaveToArtworks,
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
          <ImageChangeButton showLabel />
        </div>
      )}

      {/* 공통 컴포넌트 사용 */}
      <CameraControl variant="buttons" />
      <SideControl />
      <PositionControl />

      {/* 액션 버튼 */}
      <div className="pt-auto mt-auto space-y-3">
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
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 모바일 레이아웃 컴포넌트
function MobileLayout() {
  const {
    state,
    handleSaveToArtworks,
    isSaving,
  } = useSimpleStudioContext();

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

  if (!state.uploadedImage) {
    // 이미지 업로드 화면 재사용
    return (
      <div className="h-dvh bg-gray-50 flex items-center justify-center p-4">
        <UploadPromptBox />
      </div>
    );
  }

  // 메인 편집 화면 - 모바일 모드
  return (
    <div className="h-dvh bg-gray-50 flex flex-col relative">
      {/* 우측 상단 저장 버튼 */}
      <div className="absolute top-2 right-2 z-10">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="h-10 px-4 text-xs shadow-lg"
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>

      {/* 캔버스 영역 */}
      <div className="flex-1 flex items-center justify-center p-2">
        <div 
          className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg"
          style={{ 
            width: 'calc(100vw - 16px)',
            height: `calc((100vw - 16px) * 3 / 2)`,
            maxHeight: 'calc(100dvh - 140px)'
          }}
        >
          <CanvasPreview />
        </div>
      </div>

      {/* 컨트롤 영역 */}
      <div className="px-2 pb-2 space-y-2">
        {/* 이동 슬라이더 */}
        <div className="bg-white rounded-lg p-3 flex justify-end">
          <PositionControl compact />
        </div>

        {/* 기타 컨트롤 */}
        <div className="bg-white rounded-lg p-3 flex justify-between items-center">
          {/* 왼쪽: 이미지 변경 */}
          <ImageChangeButton />

          {/* 오른쪽: 자주 쓰는 기능들 */}
          <div className="flex gap-6">
            <SideControl />
            <CameraControl variant="arrows" />
          </div>
        </div>
      </div>
    </div>
  );
}