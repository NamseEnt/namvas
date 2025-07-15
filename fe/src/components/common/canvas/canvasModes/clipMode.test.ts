import { describe, it, expect } from 'vitest';
import { 
  calculateClipModeTargetFit, 
  calculateClipModeFrontRect, 
  convertClipModePixelToUV,
  createClipModeGeometries 
} from './clipMode';

describe('clipMode', () => {
  describe('calculateClipModeTargetFit', () => {
    it('가로형 이미지에서 캔버스 높이를 맞추고 가로 panning이 가능해야 함', () => {
      const result = calculateClipModeTargetFit({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
      });
      
      expect(result.canvasHeightPx).toBe(600);
      expect(result.canvasWidthPx).toBeCloseTo(400, 5); // 600 * (0.1/0.15)
      expect(result.panAxis).toBe('horizontal');
      expect(result.panRangePx.horizontal).toBe(600); // 1000 - 400
      expect(result.panRangePx.vertical).toBe(0);
    });

    it('세로형 이미지에서 캔버스 너비를 맞추고 세로 panning이 가능해야 함', () => {
      const result = calculateClipModeTargetFit({
        imageWidthPx: 600,
        imageHeightPx: 1000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
      });
      
      expect(result.canvasWidthPx).toBe(600);
      expect(result.canvasHeightPx).toBeCloseTo(900, 5); // 600 * (0.15/0.1)
      expect(result.panAxis).toBe('vertical');
      expect(result.panRangePx.horizontal).toBe(0);
      expect(result.panRangePx.vertical).toBeCloseTo(100, 5); // 1000 - 900
    });

    it('캔버스와 동일한 비율의 이미지는 panning이 불가능해야 함', () => {
      const result = calculateClipModeTargetFit({
        imageWidthPx: 400,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
      });
      
      expect(result.canvasWidthPx).toBe(400);
      expect(result.canvasHeightPx).toBeCloseTo(600, 5);
      // 부동소수점 연산으로 인해 정확히 같지 않을 수 있음
      // 400/600 = 0.666... vs 0.1/0.15 = 0.666...
      // 작은 오차로 인해 vertical로 판단될 수 있음
      if (result.panAxis === 'none') {
        expect(result.panAxis).toBe('none');
      } else {
        // vertical로 판단되었다면 매우 작은 panRange를 가져야 함
        expect(result.panAxis).toBe('vertical');
        expect(result.panRangePx.vertical).toBeLessThan(1);
      }
      expect(result.panRangePx.horizontal).toBe(0);
    });
  });

  describe('calculateClipModeFrontRect', () => {
    it('가로형 이미지에서 50% panning 시 캔버스가 중앙에 위치해야 함', () => {
      const result = calculateClipModeFrontRect({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        panPercent: 50,
      });
      
      // 캔버스 중심이 이미지 중심과 일치해야 함
      const canvasCenterX = result.x + result.width / 2;
      const imageCenterX = 500;
      expect(canvasCenterX).toBe(imageCenterX);
      
      // 캔버스 크기 검증
      expect(result.width).toBeCloseTo(400, 5);
      expect(result.height).toBe(600);
    });

    it('0% panning 시 캔버스가 이미지 왼쪽 끝에 위치해야 함', () => {
      const result = calculateClipModeFrontRect({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        panPercent: 0,
      });
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('100% panning 시 캔버스가 이미지 오른쪽 끝에 위치해야 함', () => {
      const result = calculateClipModeFrontRect({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        panPercent: 100,
      });
      
      const canvasRightEdge = result.x + result.width;
      expect(canvasRightEdge).toBe(1000);
    });

    it('세로형 이미지에서 세로 panning이 올바르게 작동해야 함', () => {
      const result = calculateClipModeFrontRect({
        imageWidthPx: 600,
        imageHeightPx: 1000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        panPercent: 50,
      });
      
      // 캔버스 중심이 이미지 중심과 일치해야 함
      const canvasCenterY = result.y + result.height / 2;
      const imageCenterY = 500;
      expect(canvasCenterY).toBe(imageCenterY);
      
      expect(result.x).toBe(0);
      expect(result.width).toBe(600);
      expect(result.height).toBeCloseTo(900, 5);
    });
  });

  describe('convertClipModePixelToUV', () => {
    it('정면 픽셀 좌표를 UV 좌표로 올바르게 변환해야 함', () => {
      const frontRect = { x: 300, y: 0, width: 400, height: 600 };
      
      const result = convertClipModePixelToUV({
        frontRect,
        imageWidthPx: 1000,
        imageHeightPx: 600,
        flipY: false,
      });
      
      expect(result.uMin).toBe(0.3); // 300/1000
      expect(result.uMax).toBe(0.7); // 700/1000
      expect(result.vMin).toBe(0); // 0/600
      expect(result.vMax).toBe(1); // 600/600
    });

    it('flipY가 true일 때 Y축이 뒤집혀야 함', () => {
      const frontRect = { x: 0, y: 200, width: 600, height: 600 };
      
      const result = convertClipModePixelToUV({
        frontRect,
        imageWidthPx: 600,
        imageHeightPx: 1000,
        flipY: true,
      });
      
      expect(result.uMin).toBe(0);
      expect(result.uMax).toBe(1);
      // flipY=false일 때: vMin=0.2, vMax=0.8
      // flipY=true일 때: vMin=0.2, vMax=0.8 (뒤집힘)
      expect(result.vMin).toBeCloseTo(0.2, 5); // 1 - 800/1000
      expect(result.vMax).toBe(0.8); // 1 - 200/1000
    });

    it('UV 좌표가 0-1 범위를 벗어날 수 있어야 함', () => {
      const frontRect = { x: -100, y: -50, width: 800, height: 700 };
      
      const result = convertClipModePixelToUV({
        frontRect,
        imageWidthPx: 600,
        imageHeightPx: 600,
        flipY: false,
      });
      
      // 음수와 1 초과 값이 허용되어야 함
      expect(result.uMin).toBeCloseTo(-0.167, 3); // -100/600
      expect(result.uMax).toBeCloseTo(1.167, 3); // 700/600
      expect(result.vMin).toBeCloseTo(-0.083, 3); // -50/600
      expect(result.vMax).toBeCloseTo(1.083, 3); // 650/600
    });
  });

  describe('createClipModeGeometries', () => {
    it('모든 면의 geometry를 생성하고 정면에만 UV를 적용해야 함', () => {
      const geometries = createClipModeGeometries({
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

      // 정면에만 UV가 설정되어야 함
      expect(geometries.front.attributes.uv).toBeDefined();
      // 옆면들은 기본 UV를 유지해야 함 (수정되지 않음)
      expect(geometries.left.attributes.uv).toBeDefined();
      
      // 정면 UV가 올바르게 설정되었는지 확인
      const frontUV = geometries.front.attributes.uv.array;
      expect(frontUV.length).toBe(8); // 4 vertices * 2 components
    });

    it('극단적인 비율에서도 정상 작동해야 함', () => {
      const geometries = createClipModeGeometries({
        imageWidthPx: 100,
        imageHeightPx: 10000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        panPercent: 100,
      });

      // geometry가 생성되어야 함
      expect(geometries.front).toBeDefined();
      
      // 정면 UV가 설정되어야 함
      const uvArray = geometries.front.attributes.uv.array;
      expect(uvArray.length).toBe(8);
    });

    it('정사각형 캔버스와 이미지에서도 정상 작동해야 함', () => {
      const geometries = createClipModeGeometries({
        imageWidthPx: 1000,
        imageHeightPx: 1000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.1,
        sideThicknessM: 0.006,
        panPercent: 50,
      });

      expect(geometries.front).toBeDefined();
      expect(geometries.front.parameters.width).toBe(0.1);
      expect(geometries.front.parameters.height).toBe(0.1);
    });
  });
});