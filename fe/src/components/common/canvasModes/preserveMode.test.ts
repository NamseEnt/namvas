import { describe, it, expect } from 'vitest';
import { 
  calculatePreserveModeTargetFit, 
  calculatePreserveModeFaceRects, 
  convertPreserveModePixelToUV,
  createPreserveModeGeometries 
} from './preserveMode';

describe('preserveMode', () => {
  describe('calculatePreserveModeTargetFit', () => {
    it('가로형 이미지에서 높이를 맞추고 가로 panning이 가능해야 함', () => {
      const result = calculatePreserveModeTargetFit({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
      });
      
      expect(result.unfoldedHeightPx).toBe(600);
      expect(result.unfoldedWidthPx).toBeCloseTo(414.815, 2);
      expect(result.panAxis).toBe('horizontal');
      expect(result.panRangePx.horizontal).toBeCloseTo(585.185, 2);
      expect(result.panRangePx.vertical).toBe(0);
    });

    it('세로형 이미지에서 너비를 맞추고 세로 panning이 가능해야 함', () => {
      const result = calculatePreserveModeTargetFit({
        imageWidthPx: 600,
        imageHeightPx: 1000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
      });
      
      expect(result.unfoldedWidthPx).toBe(600);
      expect(result.unfoldedHeightPx).toBeCloseTo(867.857, 2);
      expect(result.panAxis).toBe('vertical');
      expect(result.panRangePx.horizontal).toBe(0);
      expect(result.panRangePx.vertical).toBeCloseTo(132.143, 2);
    });

    it('전개도와 동일한 비율의 이미지는 panning이 불가능해야 함', () => {
      const result = calculatePreserveModeTargetFit({
        imageWidthPx: 112,
        imageHeightPx: 162,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
      });
      
      expect(result.unfoldedWidthPx).toBe(112);
      expect(result.unfoldedHeightPx).toBe(162);
      expect(result.panAxis).toBe('none');
      expect(result.panRangePx.horizontal).toBe(0);
      expect(result.panRangePx.vertical).toBe(0);
    });
  });

  describe('calculatePreserveModeFaceRects', () => {
    it('가로형 이미지에서 50% panning 시 정면이 중앙에 위치해야 함', () => {
      const result = calculatePreserveModeFaceRects({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 50,
      });
      
      // 정면 중심이 이미지 중심과 일치해야 함
      const frontCenterX = result.front.x + result.front.width / 2;
      const imageCenterX = 500;
      expect(frontCenterX).toBeCloseTo(imageCenterX, 1);
      
      // 정면 크기 검증
      expect(result.front.width).toBeCloseTo(370.370, 2);
      expect(result.front.height).toBeCloseTo(555.556, 2);
    });

    it('0% panning 시 전개도가 이미지 왼쪽 끝에 위치해야 함', () => {
      const result = calculatePreserveModeFaceRects({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 0,
      });
      
      expect(result.left.x).toBe(0);
      expect(result.front.x).toBeCloseTo(22.222, 2);
    });

    it('100% panning 시 전개도가 이미지 오른쪽 끝에 위치해야 함', () => {
      const result = calculatePreserveModeFaceRects({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 100,
      });
      
      const rightEdge = result.right.x + result.right.width;
      expect(rightEdge).toBeCloseTo(1000, 1);
    });

    it('각 면의 크기가 올바른 비율을 가져야 함', () => {
      const result = calculatePreserveModeFaceRects({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 50,
      });
      
      // 좌우 옆면 너비는 전체 너비의 약 5.36%
      const sideWidthRatio = result.left.width / (result.left.width + result.front.width + result.right.width);
      expect(sideWidthRatio).toBeCloseTo(0.0536, 3);
      
      // 상하 옆면 높이는 전체 높이의 약 3.7%
      const sideHeightRatio = result.top.height / (result.top.height + result.front.height + result.bottom.height);
      expect(sideHeightRatio).toBeCloseTo(0.037, 3);
    });
  });

  describe('convertPreserveModePixelToUV', () => {
    it('픽셀 좌표를 UV 좌표로 올바르게 변환해야 함', () => {
      const faceRects = {
        front: { x: 200, y: 100, width: 400, height: 600 },
        left: { x: 150, y: 100, width: 50, height: 600 },
        right: { x: 600, y: 100, width: 50, height: 600 },
        top: { x: 200, y: 50, width: 400, height: 50 },
        bottom: { x: 200, y: 700, width: 400, height: 50 },
      };
      
      const result = convertPreserveModePixelToUV({
        faceRects,
        imageWidthPx: 800,
        imageHeightPx: 800,
        flipY: false,
      });
      
      // 정면 UV 검증
      expect(result.front.uMin).toBe(0.25); // 200/800
      expect(result.front.uMax).toBe(0.75); // 600/800
      expect(result.front.vMin).toBe(0.125); // 100/800
      expect(result.front.vMax).toBe(0.875); // 700/800
      
      // 왼쪽면 UV 검증
      expect(result.left.uMin).toBe(0.1875); // 150/800
      expect(result.left.uMax).toBe(0.25); // 200/800
      
      // 오른쪽면 UV 검증
      expect(result.right.uMin).toBe(0.75); // 600/800
      expect(result.right.uMax).toBe(0.8125); // 650/800
    });

    it('flipY가 true일 때 Y축이 뒤집혀야 함', () => {
      const faceRects = {
        front: { x: 0, y: 200, width: 1000, height: 400 },
        left: { x: 0, y: 0, width: 0, height: 0 },
        right: { x: 0, y: 0, width: 0, height: 0 },
        top: { x: 0, y: 0, width: 0, height: 0 },
        bottom: { x: 0, y: 0, width: 0, height: 0 },
      };
      
      const result = convertPreserveModePixelToUV({
        faceRects,
        imageWidthPx: 1000,
        imageHeightPx: 1000,
        flipY: true,
      });
      
      // flipY=false일 때: vMin=0.2, vMax=0.6
      // flipY=true일 때: vMin=0.4, vMax=0.8 (뒤집힘)
      expect(result.front.vMin).toBe(0.4); // 1 - 600/1000
      expect(result.front.vMax).toBe(0.8); // 1 - 200/1000
    });

    it('UV 좌표가 0-1 범위를 벗어날 수 있어야 함 (오버플로우 허용)', () => {
      const faceRects = {
        front: { x: -100, y: -50, width: 1200, height: 900 },
        left: { x: 0, y: 0, width: 0, height: 0 },
        right: { x: 0, y: 0, width: 0, height: 0 },
        top: { x: 0, y: 0, width: 0, height: 0 },
        bottom: { x: 0, y: 0, width: 0, height: 0 },
      };
      
      const result = convertPreserveModePixelToUV({
        faceRects,
        imageWidthPx: 1000,
        imageHeightPx: 800,
        flipY: false,
      });
      
      // 음수와 1 초과 값이 허용되어야 함
      expect(result.front.uMin).toBe(-0.1); // -100/1000
      expect(result.front.uMax).toBe(1.1); // 1100/1000
      expect(result.front.vMin).toBe(-0.0625); // -50/800
      expect(result.front.vMax).toBe(1.0625); // 850/800
    });

    it('실제 calculatePreserveModeFaceRects의 결과를 UV로 변환할 수 있어야 함', () => {
      const faceRects = calculatePreserveModeFaceRects({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 50,
      });
      
      const result = convertPreserveModePixelToUV({
        faceRects,
        imageWidthPx: 1000,
        imageHeightPx: 600,
        flipY: false,
      });
      
      // 모든 UV 값이 유효한 숫자여야 함
      Object.values(result).forEach(face => {
        expect(face.uMin).toBeTypeOf('number');
        expect(face.uMax).toBeTypeOf('number');
        expect(face.vMin).toBeTypeOf('number');
        expect(face.vMax).toBeTypeOf('number');
        expect(face.uMax).toBeGreaterThan(face.uMin);
        expect(face.vMax).toBeGreaterThan(face.vMin);
      });
      
      // 50% panning에서 정면의 u 중심이 0.5여야 함
      const frontUCenter = (result.front.uMin + result.front.uMax) / 2;
      expect(frontUCenter).toBeCloseTo(0.5, 2);
    });
  });

  describe('createPreserveModeGeometries', () => {
    it('모든 면의 geometry를 생성하고 UV를 적용해야 함', () => {
      const geometries = createPreserveModeGeometries({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 50,
      });

      // 모든 면의 geometry가 생성되어야 함
      expect(geometries.front).toBeDefined();
      expect(geometries.left).toBeDefined();
      expect(geometries.right).toBeDefined();
      expect(geometries.top).toBeDefined();
      expect(geometries.bottom).toBeDefined();

      // 각 면의 크기가 올바르게 설정되어야 함
      expect(geometries.front.parameters.width).toBe(0.1);
      expect(geometries.front.parameters.height).toBe(0.15);
      expect(geometries.left.parameters.width).toBe(0.006);
      expect(geometries.left.parameters.height).toBe(0.15);
      expect(geometries.top.parameters.width).toBe(0.1);
      expect(geometries.top.parameters.height).toBe(0.006);

      // UV 속성이 설정되어야 함
      expect(geometries.front.attributes.uv).toBeDefined();
      expect(geometries.left.attributes.uv).toBeDefined();
      expect(geometries.right.attributes.uv).toBeDefined();
      expect(geometries.top.attributes.uv).toBeDefined();
      expect(geometries.bottom.attributes.uv).toBeDefined();
    });

    it('극단적인 비율에서도 정상 작동해야 함', () => {
      const geometries = createPreserveModeGeometries({
        imageWidthPx: 10000,
        imageHeightPx: 100,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 0,
      });

      // geometry가 생성되어야 함
      expect(geometries.front).toBeDefined();
      
      // UV가 설정되어야 함
      const uvArray = geometries.front.attributes.uv.array;
      expect(uvArray.length).toBe(8); // 4 vertices * 2 components
    });
  });
});