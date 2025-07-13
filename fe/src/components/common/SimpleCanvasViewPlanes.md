# 살리기 모드 구현 문서

## 🎯 **Step 1: 전개도를 이미지 위에 배치하기**

### **목적**
전개도를 유저 이미지 위에 object-fit: cover 방식으로 배치하기

### **개념 변경**
- ❌ 이전: 이미지를 전개도에 맞춤
- ✅ 현재: 전개도를 이미지에 맞춤

### **전개도란?**
```
정면과 옆면을 모두 펼쳐놓은 전체 영역
- 너비: 2t + cw = 12mm + 100mm = 112mm
- 높이: 2t + ch = 12mm + 150mm = 162mm
- 비율: 112 / 162 = 0.691
```

### **계산 과정**
1. **Object-fit: cover 적용**
   ```typescript
   if (imageAspect > unfoldedAspect) {
     // 이미지가 더 가로형 → 전개도 높이를 이미지에 맞춤
     unfoldedHeightPx = imageHeightPx;
     unfoldedWidthPx = imageHeightPx * unfoldedAspect;
     panAxis = 'horizontal';
   } else {
     // 이미지가 더 세로형 → 전개도 너비를 이미지에 맞춤
     unfoldedWidthPx = imageWidthPx;
     unfoldedHeightPx = imageWidthPx / unfoldedAspect;
     panAxis = 'vertical';
   }
   ```

2. **Panning 범위 계산**
   ```typescript
   panRangePx = {
     horizontal: Math.max(0, imageWidthPx - unfoldedWidthPx),
     vertical: Math.max(0, imageHeightPx - unfoldedHeightPx)
   }
   ```

3. **각 면의 픽셀 좌표 계산**
   ```typescript
   // 비율 계산
   sideRatio = 6mm / 112mm = 0.0536
   frontRatio = 100mm / 112mm = 0.8929
   
   // 픽셀 크기
   sideWidthPx = unfoldedWidthPx * sideRatio
   frontWidthPx = unfoldedWidthPx * frontRatio
   ```

### **구현 함수**
- `calculateUnfoldedCanvasOnImage()`: 전개도 크기와 panning 정보 계산
- `calculateFaceRects()`: 각 면의 픽셀 좌표 계산

### **결과**
- 전개도의 한 축은 이미지와 정확히 일치
- 다른 축은 비율을 유지하며 이미지보다 작음
- 사용자는 0-100% 범위로 panning 가능

---

## 🎯 **Step 2: 픽셀 좌표를 UV 좌표로 변환**

### **목적**
각 면이 표시할 이미지 영역의 픽셀 좌표를 UV 좌표로 변환

### **UV 좌표계**
- U (가로): 0 (왼쪽) ~ 1 (오른쪽)
- V (세로): 0 (아래/위) ~ 1 (위/아래) - flipY 설정에 따라 다름

### **변환 공식**
```typescript
u = pixelX / imageWidth
v = pixelY / imageHeight  // flipY = false
v = 1 - pixelY / imageHeight  // flipY = true
```

### **구현 함수**
```typescript
convertPixelToUV({
  faceRects,     // Step 1의 결과
  imageWidthPx,  // 이미지 너비
  imageHeightPx, // 이미지 높이
  flipY          // Y축 뒤집기 여부
})
```

### **결과**
각 면의 UV 범위:
```typescript
{
  front: { uMin: 0.25, uMax: 0.75, vMin: 0.1, vMax: 0.9 },
  left: { uMin: 0.18, uMax: 0.25, vMin: 0.1, vMax: 0.9 },
  // ...
}
```

---

## 🎯 **Step 3: UV를 Geometry에 적용**

### **목적**
계산된 UV 좌표를 Three.js PlaneGeometry에 적용

### **PlaneGeometry UV 구조**
```
3 --- 2
|     |
|     |
0 --- 1

UV 순서: [0, 1, 3, 2] (좌하, 우하, 좌상, 우상)
```

### **구현 함수**
1. **`applyUVToGeometry`**: 개별 geometry에 UV 적용
   ```typescript
   applyUVToGeometry(geometry, { uMin, uMax, vMin, vMax })
   ```

2. **`createPreserveModeGeometries`**: 통합 함수
   - 각 면의 픽셀 좌표 계산
   - UV 변환
   - Geometry 생성 및 UV 적용
   - 5개 면 모두 반환

### **사용 예시**
```typescript
const geometries = createPreserveModeGeometries({
  imageWidthPx: 1000,
  imageHeightPx: 600,
  canvasWidthM: 0.1,
  canvasHeightM: 0.15,
  sideThicknessM: 0.006,
  panPercent: 50,
});
```