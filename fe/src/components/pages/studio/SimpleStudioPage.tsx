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
        x: Math.max(-30, Math.min(30, state.rotation.x - deltaY * 0.5)),
        y: state.rotation.y + deltaX * 0.5,
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
    updateState,
    handleImageUpload,
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
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">카메라</span>
          <div className="h-4 w-px bg-gray-300" />
        </div>
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">옆면</span>
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
      </div>

      {/* 이미지 위치 조정 */}
      {state.uploadedImage && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Label className="text-sm font-medium">위치</Label>
            <div className="h-4 w-px bg-gray-300" />
          </div>
          
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
    updateState,
    handleImageUpload,
    handleSaveToArtworks,
    isSaving,
  } = useSimpleStudioContext();
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
        x: Math.max(-30, Math.min(30, state.rotation.x - deltaY * 0.5)),
        y: state.rotation.y + deltaX * 0.5,
      },
    });

    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
    // 이미지 업로드 화면
    return (
      <div
        className="h-dvh bg-gray-50 flex items-center justify-center p-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <label className="cursor-pointer w-full max-w-sm">
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

  // 카메라 프리셋 순환
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

      {/* 캔버스 영역 - 너비 기준 */}
      <div className="flex-1 flex items-center justify-center p-2">
        <div 
          className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-lg cursor-move"
          style={{ 
            width: 'calc(100vw - 16px)', // padding 제외
            height: `calc((100vw - 16px) * 3 / 2)`, // 2:3 비율
            maxHeight: 'calc(100dvh - 140px)' // 슬라이더 + 버튼 영역 확보
          }}
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
      </div>

      {/* 슬라이더 영역 - 오른쪽 정렬 */}
      <div className="h-12 flex items-center justify-end pr-4">
        {state.uploadedImage && (() => {
          const imageAspect = state.uploadedImage.width / state.uploadedImage.height;
          const canvasAspect = 4 / 6;
          const isHorizontalMovable = imageAspect > canvasAspect;
          
          return (
            <div className="w-1/2">
              <Slider
                value={[isHorizontalMovable ? state.imageOffset.x : state.imageOffset.y]}
                onValueChange={([value]) =>
                  updateState({ 
                    imageOffset: isHorizontalMovable 
                      ? { x: value, y: 0 } 
                      : { x: 0, y: value }
                  })
                }
                min={-1}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
          );
        })()}
      </div>

      {/* 버튼 영역 */}
      <div className="h-20 px-2 pb-2">
        <div className="h-full bg-white rounded-lg p-3 flex justify-between">
          {/* 왼쪽: 이미지 변경 */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
            />
            <Button variant="outline" size="sm" className="h-full w-12" type="button">
              🖼️
            </Button>
          </label>

          {/* 오른쪽: 자주 쓰는 기능들 */}
          <div className="flex gap-2">
            {/* 옆면 모드 */}
            <ToggleGroup 
              type="single" 
              value={state.sideMode} 
              onValueChange={(value) => value && updateState({ sideMode: value as SideMode })}
              className="h-full"
            >
              <ToggleGroupItem value={SideMode.CLIP} size="sm" className="text-xs px-2 h-full">
                자르기
              </ToggleGroupItem>
              <ToggleGroupItem value={SideMode.PRESERVE} size="sm" className="text-xs px-2 h-full">
                살리기
              </ToggleGroupItem>
              <ToggleGroupItem value={SideMode.FLIP} size="sm" className="text-xs px-2 h-full">
                뒤집기
              </ToggleGroupItem>
            </ToggleGroup>

            {/* 카메라 컨트롤 */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCameraPrev}
                className="w-12 h-full"
              >
                ◀
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCameraNext}
                className="w-12 h-full"
              >
                ▶
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}