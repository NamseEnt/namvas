import { describe, it, expect } from 'vitest';
import { 
  calculateFlipModeUVs,
  applyFlipModeUVToGeometry,
  createFlipModeGeometries 
} from './flipMode';
import * as THREE from 'three';

describe('flipMode', () => {
  describe('calculateFlipModeUVs', () => {
    it('가로형 이미지에서 각 면의 UV를 올바르게 계산해야 함', () => {
      const result = calculateFlipModeUVs({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        imageOffset: { x: 0, y: 0 }, // 중앙 (50% pan)
      });
      
      // 정면 UV는 중앙에 위치해야 함
      expect(result.front.uMin).toBe(0.3); // (1000-400)/2/1000
      expect(result.front.uMax).toBe(0.7); // (1000+400)/2/1000
      expect(result.front.vMin).toBe(0);
      expect(result.front.vMax).toBe(1);
      
      // 왼쪽면은 정면의 왼쪽 가장자리에서 시작
      expect(result.left.uMin).toBe(0.3);
      expect(result.left.flipX).toBe(true);
      expect(result.left.vMin).toBe(0);
      expect(result.left.vMax).toBe(1);
      
      // 오른쪽면은 정면의 오른쪽 가장자리에서 시작
      expect(result.right.uMax).toBe(0.7);
      expect(result.right.flipX).toBe(true);
      
      // 상단면과 하단면은 Y축 뒤집기
      expect(result.top.flipY).toBe(true);
      expect(result.bottom.flipY).toBe(true);
    });

    it('세로형 이미지에서 세로 panning이 적용되어야 함', () => {
      const result = calculateFlipModeUVs({
        imageWidthPx: 600,
        imageHeightPx: 1000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        imageOffset: { x: 0, y: 0 }, // 중앙
      });
      
      // 정면 UV
      expect(result.front.uMin).toBe(0);
      expect(result.front.uMax).toBe(1);
      expect(result.front.vMin).toBeCloseTo(0.05, 5); // (1000-900)/2/1000
      expect(result.front.vMax).toBeCloseTo(0.95, 5); // (1000+900)/2/1000
      
      // 상단면은 정면의 상단 가장자리에서 시작
      expect(result.top.vMax).toBe(0.95);
      expect(result.top.flipY).toBe(true);
      
      // 하단면은 정면의 하단 가장자리에서 시작
      expect(result.bottom.vMin).toBeCloseTo(0.05, 5);
      expect(result.bottom.flipY).toBe(true);
    });

    it('옆면 크기가 캔버스 크기에 비례해야 함', () => {
      const result = calculateFlipModeUVs({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        imageOffset: { x: 0, y: 0 },
      });
      
      // 좌우 옆면의 너비는 두께/캔버스너비 비율
      const leftWidth = result.left.uMax - result.left.uMin;
      const expectedWidth = (result.front.uMax - result.front.uMin) * (0.006 / 0.1);
      expect(leftWidth).toBeCloseTo(expectedWidth, 5);
      
      // 상하 옆면의 높이는 두께/캔버스높이 비율
      const topHeight = result.top.vMax - result.top.vMin;
      const expectedHeight = (result.front.vMax - result.front.vMin) * (0.006 / 0.15);
      expect(topHeight).toBeCloseTo(expectedHeight, 5);
    });

    it('극단적인 offset에서도 UV가 0-1 범위 내에 클램핑되어야 함', () => {
      const result = calculateFlipModeUVs({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        imageOffset: { x: 1, y: 1 }, // 최대 offset
      });
      
      // 모든 UV 값이 0-1 범위 내에 있어야 함
      [result.front, result.left, result.right, result.top, result.bottom].forEach(face => {
        expect(face.uMin).toBeGreaterThanOrEqual(0);
        expect(face.uMax).toBeLessThanOrEqual(1);
        expect(face.vMin).toBeGreaterThanOrEqual(0);
        expect(face.vMax).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('applyFlipModeUVToGeometry', () => {
    it('X축 뒤집기가 올바르게 적용되어야 함', () => {
      const geometry = new THREE.PlaneGeometry(0.006, 0.15);
      const uvBounds = {
        uMin: 0.3,
        uMax: 0.4,
        vMin: 0.2,
        vMax: 0.8,
        flipX: true,
      };
      
      applyFlipModeUVToGeometry(geometry, uvBounds);
      
      const uvArray = geometry.attributes.uv.array;
      // X축 뒤집기: 좌우가 바뀜
      expect(uvArray[0]).toBeCloseTo(0.4, 5); // 좌하 u -> uMax
      expect(uvArray[2]).toBeCloseTo(0.3, 5); // 우하 u -> uMin
      expect(uvArray[4]).toBeCloseTo(0.4, 5); // 좌상 u -> uMax
      expect(uvArray[6]).toBeCloseTo(0.3, 5); // 우상 u -> uMin
    });

    it('Y축 뒤집기가 올바르게 적용되어야 함', () => {
      const geometry = new THREE.PlaneGeometry(0.1, 0.006);
      const uvBounds = {
        uMin: 0.3,
        uMax: 0.7,
        vMin: 0.1,
        vMax: 0.2,
        flipY: true,
      };
      
      applyFlipModeUVToGeometry(geometry, uvBounds);
      
      const uvArray = geometry.attributes.uv.array;
      // Y축 뒤집기: 상하가 바뀜
      expect(uvArray[1]).toBeCloseTo(0.2, 5); // 좌하 v -> vMax
      expect(uvArray[3]).toBeCloseTo(0.2, 5); // 우하 v -> vMax
      expect(uvArray[5]).toBeCloseTo(0.1, 5); // 좌상 v -> vMin
      expect(uvArray[7]).toBeCloseTo(0.1, 5); // 우상 v -> vMin
    });

    it('뒤집기가 없을 때는 일반 UV가 적용되어야 함', () => {
      const geometry = new THREE.PlaneGeometry(0.1, 0.15);
      const uvBounds = {
        uMin: 0.3,
        uMax: 0.7,
        vMin: 0.0,
        vMax: 1.0,
      };
      
      applyFlipModeUVToGeometry(geometry, uvBounds);
      
      const uvArray = geometry.attributes.uv.array;
      // 일반 UV 매핑
      expect(uvArray[0]).toBeCloseTo(0.3, 5); // 좌하 u
      expect(uvArray[1]).toBeCloseTo(0.0, 5); // 좌하 v
      expect(uvArray[2]).toBeCloseTo(0.7, 5); // 우하 u
      expect(uvArray[3]).toBeCloseTo(0.0, 5); // 우하 v
      expect(uvArray[4]).toBeCloseTo(0.3, 5); // 좌상 u
      expect(uvArray[5]).toBeCloseTo(1.0, 5); // 좌상 v
      expect(uvArray[6]).toBeCloseTo(0.7, 5); // 우상 u
      expect(uvArray[7]).toBeCloseTo(1.0, 5); // 우상 v
    });
  });

  describe('createFlipModeGeometries', () => {
    it('모든 면의 geometry를 생성하고 UV를 적용해야 함', () => {
      const geometries = createFlipModeGeometries({
        imageWidthPx: 1000,
        imageHeightPx: 600,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        imageOffset: { x: 0, y: 0 },
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

      // 모든 면에 UV가 설정되어야 함
      expect(geometries.front.attributes.uv).toBeDefined();
      expect(geometries.left.attributes.uv).toBeDefined();
      expect(geometries.right.attributes.uv).toBeDefined();
      expect(geometries.top.attributes.uv).toBeDefined();
      expect(geometries.bottom.attributes.uv).toBeDefined();
    });

    it('극단적인 비율에서도 정상 작동해야 함', () => {
      const geometries = createFlipModeGeometries({
        imageWidthPx: 10000,
        imageHeightPx: 100,
        canvasWidthM: 0.1,
        canvasHeightM: 0.15,
        sideThicknessM: 0.006,
        imageOffset: { x: -1, y: -1 },
      });

      // geometry가 생성되어야 함
      expect(geometries.front).toBeDefined();
      
      // UV가 설정되어야 함
      const uvArray = geometries.front.attributes.uv.array;
      expect(uvArray.length).toBe(8);
      
      // 옆면 UV도 설정되어야 함
      expect(geometries.left.attributes.uv.array.length).toBe(8);
      expect(geometries.right.attributes.uv.array.length).toBe(8);
    });

    it('정사각형 캔버스에서도 정상 작동해야 함', () => {
      const geometries = createFlipModeGeometries({
        imageWidthPx: 1000,
        imageHeightPx: 1000,
        canvasWidthM: 0.1,
        canvasHeightM: 0.1,
        sideThicknessM: 0.01,
        imageOffset: { x: 0.5, y: -0.5 },
      });

      expect(geometries.front).toBeDefined();
      expect(geometries.front.parameters.width).toBe(0.1);
      expect(geometries.front.parameters.height).toBe(0.1);
      
      // 정사각형에서도 옆면 크기가 올바르게 설정되어야 함
      expect(geometries.left.parameters.width).toBe(0.01);
      expect(geometries.top.parameters.height).toBe(0.01);
    });
  });
});