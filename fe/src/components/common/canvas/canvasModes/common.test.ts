import { describe, it, expect } from 'vitest';
import { SideMode, offsetToPanPercent } from './common';

describe('common', () => {
  describe('SideMode enum', () => {
    it('올바른 enum 값을 가져야 함', () => {
      expect(SideMode.CLIP).toBe('clip');
      expect(SideMode.PRESERVE).toBe('preserve');
      expect(SideMode.FLIP).toBe('flip');
    });
  });

  describe('offsetToPanPercent', () => {
    it('offset -1은 panPercent 0으로 변환되어야 함', () => {
      expect(offsetToPanPercent(-1)).toBe(0);
    });

    it('offset 0은 panPercent 50으로 변환되어야 함', () => {
      expect(offsetToPanPercent(0)).toBe(50);
    });

    it('offset 1은 panPercent 100으로 변환되어야 함', () => {
      expect(offsetToPanPercent(1)).toBe(100);
    });

    it('중간 값들이 올바르게 변환되어야 함', () => {
      expect(offsetToPanPercent(-0.5)).toBe(25);
      expect(offsetToPanPercent(0.5)).toBe(75);
    });

    it('범위를 벗어난 값도 처리할 수 있어야 함', () => {
      // -1보다 작은 값
      expect(offsetToPanPercent(-2)).toBe(-50);
      // 1보다 큰 값
      expect(offsetToPanPercent(2)).toBe(150);
    });

    it('소수점 정밀도가 유지되어야 함', () => {
      expect(offsetToPanPercent(0.123)).toBeCloseTo(56.15, 2);
      expect(offsetToPanPercent(-0.789)).toBeCloseTo(10.55, 2);
    });
  });
});