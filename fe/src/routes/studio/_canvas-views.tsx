/*
### **컴포넌트 명세: 좌측 프리뷰 영역 (Left Preview Area)**

#### **1. 개념 및 명칭**

* **컨셉:** 멀티 앵글 프리뷰 (Multi-Angle Preview)
* **핵심 역할:** 10개의 각기 다른 캔버스 액자를 바라보는 앵글을 한 화면에 그리드 형태로 펼쳐 보여준다. 이를 통해 사용자는 자신의 편집이 모든 면에 미치는 영향을 즉각적이고 종합적으로 파악할 수 있다.

#### **2. 컴포넌트 (초기 상태 - 이미지 업로드 전)**

* **업로드 유도 박스 (Upload Prompt Box):**
    * **기능:** 이 영역 전체가 하나의 완전한 업로드 컴포넌트로 작동한다. 파일 드래그 앤 드롭과 **클릭 시 파일 탐색기 열기 기능을 모두 지원**한다.
    * **안내 텍스트:** 박스 내부에 다음의 텍스트를 명확하게 표시한다.
        > **"여기에 사진을 드래그 앤 드롭 하거나 클릭하여 업로드하세요."**

#### **3. 컴포넌트 (활성 상태 - 이미지 업로드 후)**

이미지 업로드 시, 프리뷰 영역은 10개의 뷰 조각으로 구성된 **'퍼스펙티브 콜라주(Perspective Collage)'**로 즉시 전환된다.

* **뷰 레이아웃 및 번호:**

| 번호 | 뷰 명칭 | 레이아웃 상 위치 | 특징 |
| :--- | :--- | :--- | :--- |
| `6` | **앞면** | 중앙 | 가장 큰 크기로, 사용자의 주 상호작용 대상 |
| `5` | 45도 왼면 | 앞면 좌측 | - |
| `7` | 45도 오른면 | 앞면 우측 | - |
| `4` | 완전 왼면 | 45도 왼면 좌측 | - |
| `8` | 완전 오른면 | 45도 오른면 우측 | - |
| `2` | 45도 윗면 | 앞면 위 | - |
| `1` | 45도 상좌 꼭지점뷰 | 45도 윗면 좌측 | 상대적으로 큰 비중 차지 |
| `3` | 45도 상우 꼭지점뷰 | 45도 윗면 우측 | 상대적으로 큰 비중 차지 |
| `0` | 완전 위 | 45도 윗면 위 | - |
| `9` | 아랫면 | 앞면 아래 | - |

* **시각적 표현:** 제시된 그리드 `(110033 / 112233 / 45566778 / 45566778 / 99)`에 따라 각 뷰의 상대적 크기와 위치를 정밀하게 구현한다. 각 뷰는 해당 각도를 표현하기 위한 CSS `transform` 속성을 가진다.

```
 110033
 112233
45566778
45566778
   99
```

#### **4. 핵심 인터랙션: 실시간 동기화 (Real-time Synchronization)**

* **주 조작 대상:** 사용자는 가장 큰 **`앞면(6)`** 뷰 위에서만 마우스 드래그(위치 이동) 및 휠/트랙패드(확대/축소) 조작을 수행한다.
* **동시 반응:** `앞면(6)` 뷰에 가해진 모든 변경(위치, 크기)은 나머지 9개 위성 뷰(`0, 1, 2, 3, 4, 5, 7, 8, 9`)에 즉시, 그리고 동시에 반영된다.
* **전역 옵션 반영:** 우측 컨트롤 패널에서 '옆면 처리' 옵션(예: 흰색, 단색, 미러랩)을 변경하면, 해당되는 모든 옆면 뷰들에 그 결과가 실시간으로 한꺼번에 적용된다.

# 개발 방법 지시사항
1. 캔버스 액자의 윗면, 좌면, 정면, 우면, 하면 5개를 정의한다.
2. 각 5개 면이 어떻게 보여야하는지 canvas element 형태로 나타낸다.
3. 각종 view 는 위 canvas element들의 ctx transform로 가공해서 사용자에게 보여준다.

# 캔버스 액자에 대한 정의
- 캔버스 액자의 모든 면은 기본적으로 흰색이다.
- 캔버스 액자의 크기는 좌우 100mm, 상하 150mm, 두께 6mm이다.
  - 그러므로 각 Canvas element(이하 CE)의 크기도 이에 맞게 설정되어야한다.
    - 윗면 CE = w: 100mm, h: 6mm
    - 좌면 CE = w: 6mm, h: 150mm
    - 정면 CE = w: 100mm, h: 150mm
    - 우면 CE = w: 6mm, h: 150mm
    - 하면 CE = w: 100mm, h: 6mm

# 렌더링
하나의 offline canvas elemenet에 three.js로 캔버스 액자를 렌더링 한 다음에
그것을 각 뷰의 ctx에 그려서 사용자에게 보여준다.

*/
import {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useMemo,
} from "react";
import { CanvasTexture } from "three";
import * as THREE from "three";
import { useStudioContext } from ".";

type CanvasViewsState = {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  scale: number;
  imageCenter: { x: number; y: number };
  fiveSideCanvasElements: FiveSideCanvasElements;
};

const CanvasViewsContext = createContext<{
  state: CanvasViewsState;
  setState: (updates: Partial<CanvasViewsState>) => void;
  handleMainCanvasInteraction: (e: React.MouseEvent) => void;
  handleWheel: (e: React.WheelEvent) => void;
}>(null as any);

const useCanvasViewsContext = () => useContext(CanvasViewsContext);

export default function CanvasViews() {
  const { state: studioState } = useStudioContext();
  const [state, setState] = useState<CanvasViewsState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    scale: 1,
    imageCenter: { x: 0, y: 0 },
    fiveSideCanvasElements: generateFiveSideCanvasElements(),
  });

  useEffect(() => {
    const { uploadedImage, defaultColor } = studioState;
    const { scale, imageCenter } = state;
    if (!uploadedImage) {
      return;
    }

    const bigCanvas = drawBigCanvas({
      defaultColor,
      uploadedImage,
      imageCenter,
      scale,
    });

    renderBigCanvasToFiveSideCanvasElements(
      bigCanvas,
      state.fiveSideCanvasElements
    );
  }, [
    state.fiveSideCanvasElements,
    studioState.defaultColor,
    studioState.uploadedImage,
    state.imageCenter.x,
    state.imageCenter.y,
    state.scale,
  ]);

  const updateState = (updates: Partial<CanvasViewsState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleMainCanvasInteraction = (e: React.MouseEvent) => {
    if (e.type === "mousedown") {
      updateState({
        isDragging: true,
        dragOffset: {
          x: e.clientX - state.imageCenter.x,
          y: e.clientY - state.imageCenter.y,
        },
      });
    } else if (e.type === "mousemove" && state.isDragging) {
      updateState({
        imageCenter: {
          x: e.clientX - state.dragOffset.x,
          y: e.clientY - state.dragOffset.y,
        },
      });
    } else if (e.type === "mouseup") {
      updateState({ isDragging: false });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    updateState({
      scale: Math.max(0.1, Math.min(3, state.scale * scaleChange)),
    });
  };

  return (
    <CanvasViewsContext.Provider
      value={{
        state,
        setState: updateState,
        handleMainCanvasInteraction,
        handleWheel,
      }}
    >
      <div className="w-full h-full bg-gray-100">
        {!studioState.uploadedImage ? (
          <UploadPromptBox />
        ) : (
          <PerspectiveCollage />
        )}
      </div>
    </CanvasViewsContext.Provider>
  );
}

function UploadPromptBox() {
  const { handleImageUpload } = useStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-2">
          여기에 사진을 드래그 앤 드롭 하거나 클릭하여 업로드하세요.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

type FiveSideCanvasElements = {
  top: OffscreenCanvas;
  left: OffscreenCanvas;
  front: OffscreenCanvas;
  right: OffscreenCanvas;
  bottom: OffscreenCanvas;
};

function generateFiveSideCanvasElements(): FiveSideCanvasElements {
  const top = new OffscreenCanvas(100, 6);
  const left = new OffscreenCanvas(6, 150);
  const front = new OffscreenCanvas(100, 150);
  const right = new OffscreenCanvas(6, 150);
  const bottom = new OffscreenCanvas(100, 6);

  // 기본 흰색으로 초기화
  [top, left, front, right, bottom].forEach((canvas) => {
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  return { top, left, front, right, bottom };
}

function drawBigCanvas({
  defaultColor,
  uploadedImage,
  imageCenter,
  scale,
}: {
  defaultColor: string;
  uploadedImage: HTMLImageElement;
  imageCenter: { x: number; y: number };
  scale: number;
}) {
  const width = 6 + 100 + 6;
  const height = 6 + 150 + 6;
  const bigCanvas = new OffscreenCanvas(width, height);
  const bigCtx = bigCanvas.getContext("2d")!;

  // 큰 캔버스를 기본 색상으로 채우기
  bigCtx.fillStyle = defaultColor;
  bigCtx.fillRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;

  bigCtx.save();
  bigCtx.translate(centerX + imageCenter.x, centerY + imageCenter.y);
  bigCtx.scale(scale, scale);
  bigCtx.drawImage(
    uploadedImage,
    -uploadedImage.width / 2,
    -uploadedImage.height / 2
  );
  bigCtx.restore();

  return bigCanvas;
}

function renderBigCanvasToFiveSideCanvasElements(
  bigCanvas: OffscreenCanvas,
  fiveSideCanvasElements: FiveSideCanvasElements
) {
  const { top, left, front, right, bottom } = fiveSideCanvasElements;

  top
    .getContext("2d")!
    .drawImage(
      bigCanvas,
      left.width,
      0,
      top.width,
      top.height,
      0,
      0,
      top.width,
      top.height
    );

  left
    .getContext("2d")!
    .drawImage(
      bigCanvas,
      0,
      top.height,
      left.width,
      left.height,
      0,
      0,
      left.width,
      left.height
    );

  front
    .getContext("2d")!
    .drawImage(
      bigCanvas,
      left.width,
      top.height,
      front.width,
      front.height,
      0,
      0,
      front.width,
      front.height
    );

  right
    .getContext("2d")!
    .drawImage(
      bigCanvas,
      left.width + front.width,
      top.height,
      right.width,
      right.height,
      0,
      0,
      right.width,
      right.height
    );

  bottom
    .getContext("2d")!
    .drawImage(
      bigCanvas,
      left.width,
      top.height + front.height,
      bottom.width,
      bottom.height,
      0,
      0,
      bottom.width,
      bottom.height
    );
}

function PerspectiveCollage() {
  const { state, handleMainCanvasInteraction, handleWheel } =
    useCanvasViewsContext();

  // 그리드 레이아웃 정의: 110033 / 112233 / 45566778 / 45566778 / 99
  const gridLayout = [
    [1, 1, 0, 0, 3, 3],
    [1, 1, 2, 2, 3, 3],
    [4, 5, 5, 6, 6, 7, 7, 8],
    [4, 5, 5, 6, 6, 7, 7, 8],
    [null, null, 9, 9, null, null, null, null],
  ];

  return (
    <div className="w-full h-full p-4">
      <div className="grid grid-cols-8 grid-rows-5 gap-2 h-full">
        {gridLayout.map((row, rowIndex) =>
          row.map((viewId, colIndex) => {
            if (viewId === null) {
              return <div key={`${rowIndex}-${colIndex}`} />;
            }

            const isMainView = viewId === 6; // 앞면

            return (
              <div
                key={`${rowIndex}-${colIndex}-${viewId}`}
                className="bg-white border border-gray-300 rounded overflow-hidden"
              >
                <CanvasView />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
