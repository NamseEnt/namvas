// 옆면 처리 모드
export enum SideMode {
  CLIP = "clip",     // 자르기
  PRESERVE = "preserve", // 살리기
  FLIP = "flip"      // 뒤집기
}

// imageOffset (-1 ~ 1)을 panPercent (0 ~ 100)로 변환
export function offsetToPanPercent(offset: number): number {
  return (offset + 1) * 50;
}