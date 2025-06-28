/**
 * Universal Test Runner
 * Works with both Bun and LLRT environments
 */

interface TestFunction {
  (name: string, fn: () => Promise<void> | void): void;
}

interface ExpectFunction {
  (actual: any): {
    toBe: (expected: any) => void;
    toMatchObject: (expected: any) => void;
    toHaveProperty: (key: string) => void;
    toEqual: (expected: any) => void;
    any: (type: any) => any;
  };
  any: (type: any) => any;
}

// Environment detection
const isBun = typeof Bun !== 'undefined';
const isLLRT = !isBun && typeof globalThis !== 'undefined';

let bunTest: any;
let bunExpect: any;

// Import Bun test utilities if available
if (isBun) {
  try {
    const bunTestModule = await import("bun:test");
    bunTest = bunTestModule.test;
    bunExpect = bunTestModule.expect;
  } catch {
    // Fallback if bun:test not available
  }
}

// Simple expect implementation for LLRT
function createSimpleExpect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toMatchObject(expected: any) {
      for (const key in expected) {
        if (typeof expected[key] === 'function') {
          // Handle expect.any() pattern
          if (expected[key].name === 'Number' || expected[key].name === 'String' || expected[key].name === 'Boolean') {
            const expectedType = expected[key].name.toLowerCase();
            const actualType = typeof actual[key];
            if (actualType !== expectedType) {
              throw new Error(`Expected ${key} to be ${expectedType}, but got ${actualType}`);
            }
          }
        } else if (actual[key] !== expected[key]) {
          throw new Error(`Expected ${key} to be ${expected[key]}, but got ${actual[key]}`);
        }
      }
    },
    toHaveProperty(key: string) {
      if (!(key in actual)) {
        throw new Error(`Expected object to have property '${key}'`);
      }
    },
    toEqual(expected: any) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, but got ${actualStr}`);
      }
    },
    any(type: any) {
      return type;
    }
  };
}

// Test function implementation
const testImpl: TestFunction = isBun && bunTest 
  ? bunTest 
  : async (name: string, fn: () => Promise<void> | void) => {
      try {
        console.log(`🧪 Running: ${name}`);
        await fn();
        console.log(`✅ Passed: ${name}`);
      } catch (error) {
        console.error(`❌ Failed: ${name}`);
        console.error(`   Error: ${error.message}`);
        throw error;
      }
    };

// Expect function implementation
const expectImpl: ExpectFunction = isBun && bunExpect
  ? bunExpect
  : createSimpleExpect;

// Export unified interface
export const test = testImpl;
export const expect = expectImpl;

// Add expect.any for compatibility
expect.any = (type: any) => type;