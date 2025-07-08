// 가격 관련 상수
export const PRICES = {
  CANVAS: 10000,           // 캔버스 기본 가격
  PLASTIC_STAND: 250,      // 플라스틱 스탠드 가격
  SHIPPING: 3000,          // 배송비
} as const;

// 캔버스 크기 관련 상수 (mm)
export const CANVAS_SIZE = {
  WIDTH: 101.6,   // 4 inches in mm
  HEIGHT: 152.4,  // 6 inches in mm
} as const;

// 캔버스 크기 (인치)
export const CANVAS_SIZE_INCHES = {
  WIDTH: 4,
  HEIGHT: 6,
} as const;

// 캔버스 크기 (cm)
export const CANVAS_SIZE_CM = {
  WIDTH: 10,
  HEIGHT: 15,
} as const;