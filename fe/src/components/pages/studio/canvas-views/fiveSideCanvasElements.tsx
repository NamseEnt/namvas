// import { useEffect, useMemo } from "react";
// import { useStudioContext } from "..";
// import { useCanvasViewsContext } from ".";

// export type FiveSideCanvasElements = {
//   top: OffscreenCanvas;
//   left: OffscreenCanvas;
//   front: OffscreenCanvas;
//   right: OffscreenCanvas;
//   bottom: OffscreenCanvas;
// };

// export function useFiveSideCanvasElements() {
//   const fiveSideCanvasElements = useMemo<FiveSideCanvasElements>(
//     generateFiveSideCanvasElements,
//     []
//   );
//   const { state: studioState } = useStudioContext();
//   const { state } = useCanvasViewsContext();

//   useEffect(() => {
//     const { uploadedImage, defaultColor } = studioState;
//     const { scale, imageCenter } = state;
//     if (!uploadedImage) {
//       return;
//     }

//     const bigCanvas = drawBigCanvas({
//       defaultColor,
//       uploadedImage,
//       imageCenter,
//       scale,
//     });

//     renderBigCanvasToFiveSideCanvasElements(bigCanvas, fiveSideCanvasElements);
//   }, [
//     fiveSideCanvasElements,
//     studioState.defaultColor,
//     studioState.uploadedImage,
//     state.imageCenter.x,
//     state.imageCenter.y,
//     state.scale,
//   ]);

//   return fiveSideCanvasElements;
// }

// function generateFiveSideCanvasElements(): FiveSideCanvasElements {
//   const top = new OffscreenCanvas(100, 6);
//   const left = new OffscreenCanvas(6, 150);
//   const front = new OffscreenCanvas(100, 150);
//   const right = new OffscreenCanvas(6, 150);
//   const bottom = new OffscreenCanvas(100, 6);

//   // 기본 흰색으로 초기화
//   [top, left, front, right, bottom].forEach((canvas) => {
//     const ctx = canvas.getContext("2d")!;
//     ctx.fillStyle = "#ffffff";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//   });

//   return { top, left, front, right, bottom };
// }

// function renderBigCanvasToFiveSideCanvasElements(
//   bigCanvas: OffscreenCanvas,
//   fiveSideCanvasElements: FiveSideCanvasElements
// ) {
//   const { top, left, front, right, bottom } = fiveSideCanvasElements;

//   top
//     .getContext("2d")!
//     .drawImage(
//       bigCanvas,
//       left.width,
//       0,
//       top.width,
//       top.height,
//       0,
//       0,
//       top.width,
//       top.height
//     );

//   left
//     .getContext("2d")!
//     .drawImage(
//       bigCanvas,
//       0,
//       top.height,
//       left.width,
//       left.height,
//       0,
//       0,
//       left.width,
//       left.height
//     );

//   front
//     .getContext("2d")!
//     .drawImage(
//       bigCanvas,
//       left.width,
//       top.height,
//       front.width,
//       front.height,
//       0,
//       0,
//       front.width,
//       front.height
//     );

//   right
//     .getContext("2d")!
//     .drawImage(
//       bigCanvas,
//       left.width + front.width,
//       top.height,
//       right.width,
//       right.height,
//       0,
//       0,
//       right.width,
//       right.height
//     );

//   bottom
//     .getContext("2d")!
//     .drawImage(
//       bigCanvas,
//       left.width,
//       top.height + front.height,
//       bottom.width,
//       bottom.height,
//       0,
//       0,
//       bottom.width,
//       bottom.height
//     );
// }

// function drawBigCanvas({
//   defaultColor,
//   uploadedImage,
//   imageCenter,
//   scale,
// }: {
//   defaultColor: string;
//   uploadedImage: HTMLImageElement;
//   imageCenter: { x: number; y: number };
//   scale: number;
// }) {
//   const width = 6 + 100 + 6;
//   const height = 6 + 150 + 6;
//   const bigCanvas = new OffscreenCanvas(width, height);
//   const bigCtx = bigCanvas.getContext("2d")!;

//   // 큰 캔버스를 기본 색상으로 채우기
//   bigCtx.fillStyle = defaultColor;
//   bigCtx.fillRect(0, 0, width, height);

//   const centerX = width / 2;
//   const centerY = height / 2;

//   bigCtx.save();
//   bigCtx.translate(centerX + imageCenter.x, centerY + imageCenter.y);
//   bigCtx.scale(scale, scale);
//   bigCtx.drawImage(
//     uploadedImage,
//     -uploadedImage.width / 2,
//     -uploadedImage.height / 2
//   );
//   bigCtx.restore();

//   return bigCanvas;
// }
