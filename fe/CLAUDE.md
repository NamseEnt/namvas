# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents
- [⚡ Quick Reference](#-quick-reference)
- [🚨 Critical Rules](#-critical-rules)
- [📋 Architecture Guidelines](#-architecture-guidelines)
- [🎨 Code Standards](#-code-standards)
- [📖 Advanced Patterns](#-advanced-patterns)
- [🔧 Development Guidelines](#-development-guidelines)
- [✅ Work Completion Review](#-work-completion-review)

---

## ⚡ Quick Reference

### 🏷️ Variable Naming
- **Units**: `widthInch`, `heightMm`, `distanceM`, `sizePx`
- **Canvas**: `CanvasProduct` (physical frame) vs `CanvasElement` (HTML element)

### 🚫 Never Use
- `window.location` → Use `useNavigate()` or `Link`
- `null` → Use `undefined`
- Business logic in route files
- Direct mutations/queries in components

### ✅ Always Use
- Custom hooks for API calls
- Named functions in `useEffect`
- Component splitting at 50+ lines
- Unit suffixes for measurements

### 🔄 Common Patterns
```tsx
// API calls
const { data, isLoading } = useMyCustomHook();

// Effects
useEffect(function handleWindowResize() { ... }, []);

// State
const [user, setUser] = useState<User>(); // undefined, not null

// Navigation
navigate({ to: "/path/$id", params: { id } });
```

---

## 🚨 Critical Rules

### Unit Naming Convention
⚠️ **CRITICAL**: Always use unit suffixes for variables containing measurements:

- **Inch**: `widthInch`, `heightInch`, `positionXInch`
- **Millimeter**: `widthMm`, `heightMm`, `offsetXMm`
- **Meter**: `widthM`, `heightM`, `distanceM`
- **Pixel**: `widthPx`, `heightPx`, `leftPx`

### React-Three-Fiber Unit Rules
⚠️ **EXTREMELY IMPORTANT**: React-Three-Fiber uses **meters** as the base unit.

- **All r3f geometry, positions, and distances MUST be in meters**
- **Always convert before passing to r3f components**

```tsx
// Required conversion functions
const inchToMeter = (inch: number) => inch * 0.0254;
const mmToMeter = (mm: number) => mm * 0.001;

// ✅ Correct
const canvasWidthInch = 4;
const canvasWidthM = inchToMeter(canvasWidthInch);
<mesh position={[0, 0, canvasWidthM]}>

// ❌ Wrong - breaks lighting and physics
<mesh position={[0, 0, canvasWidthInch]}>
```

### Canvas Naming Convention
- **CanvasProduct**: Physical canvas frame product sold on website
- **CanvasElement**: HTML `<canvas>` element for drawing/graphics
- **Never use "Canvas" alone** - always clarify which type

---

## 📋 Architecture Guidelines

### Route File Organization
**Route files** (`src/routes/*.tsx`): Only `createFileRoute`, route configuration, and exports
**Page components** (`src/components/pages/*`): Actual page implementation with business logic

```tsx
// ✅ Route file
export const Route = createFileRoute("/example")({
  component: ExamplePage,
});

// ❌ Wrong - no business logic in routes
export const Route = createFileRoute("/example")({
  component: () => {
    const [state, setState] = useState(); // Don't do this
    return <div>...</div>;
  },
});
```

### Custom Hooks for API Calls
**Never use mutations or queries directly in components**. Always create custom hooks:

```tsx
// ✅ Custom hook
export function useAuth() {
  const logoutMutation = useMutation({
    mutationFn: userApi.logout,
    onSuccess: () => { /* handle success */ },
    onError: (error) => { /* handle error */ },
  });

  return {
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

// ✅ Component using custom hook
export function MyComponent() {
  const { logout, isLoggingOut } = useAuth();
  return <button onClick={() => logout()}>로그아웃</button>;
}
```

### Component Organization
- **Common components** (`src/components/common/*`): Reusable across pages
- **Page components** (`src/components/pages/*`): Specific to individual pages
- **Extract at 3+ usage**: Create common component if used 3+ times

### Navigation
- **Use `Link` component** for declarative navigation
- **Use `useNavigate` hook** for programmatic navigation
- **NEVER use `window.location`**

---

## 🎨 Code Standards

### React Components
- Use `function` declarations, not `const`
- Props: Define inline, no separate type definitions
- **Component size limit**: 50 lines max - split if larger
- **Always use curly braces** for if statements

### TypeScript
- Prefer `undefined` over `null`
- Props: Inline types only
- Prefer `type` over `interface`
- **Avoid optional parameters** - use explicit parameters

### useEffect Pattern
Use named functions that describe what the effect does:

```tsx
// ✅ Correct
useEffect(function updateCameraDistance() {
  const distance = baseCameraDistance + Math.abs(rotation.y) * multiplier;
  setCameraDistance(distance);
}, [rotation.y]);

// ❌ Wrong
useEffect(() => {
  const distance = baseCameraDistance + Math.abs(rotation.y) * multiplier;
  setCameraDistance(distance);
}, [rotation.y]);
```

### File Structure
- **Exports**: Always at top of file
- **Private components**: At bottom of file
- **File size**: Under 200 lines recommended, 300 max
- **Split when exceeded**: Extract utils, hooks, constants

### Three.js
- **Never override Three.js default values** unless absolutely necessary
- Document any overrides with clear reasoning

---

## 📖 Advanced Patterns

### Component Internal Context Pattern
Use when multiple sub-components need shared state (3+ levels of prop drilling):

```tsx
type ComponentState = {
  field1: string;
  field2: boolean;
  field3: number;
};

const ComponentContext = createContext<{
  state: ComponentState;
  updateState: (updates: Partial<ComponentState>) => void;
  handler: () => void;
}>(null!);

const useComponentContext = () => useContext(ComponentContext);

// Implementation
export default function MyComponent() {
  const [state, setState] = useState<ComponentState>({
    field1: "", field2: false, field3: 0,
  });

  const updateState = (updates: Partial<ComponentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <ComponentContext.Provider value={{ state, updateState, handler }}>
      <SubComponent1 />
      <SubComponent2 />
    </ComponentContext.Provider>
  );
}
```

### Folder Structure for Complex Components
```
ComponentName/
├── index.tsx          # Main component (under 50 lines)
├── SubComponent.tsx   # Complex sub-components
├── hooks.ts          # Custom hooks
├── utils.ts          # Helper functions
└── constants.ts      # Constants, types, config
```

---

## 🔧 Development Guidelines

### Package Management & Development
- **Never install packages** without explicit permission
- **Never run dev server** - usually already running
- **Git commits**: Title only, no body

### UI & Styling
- **Tailwind CSS v4.1**: Use latest documentation
- **shadcn/ui**: Always use CLI to install (`npx shadcn@latest add <component>`)
- **Never manually write** shadcn/ui components

### Backend Compatibility
⚠️ **LLRT Runtime**: When working with backend code:
- **Never use Node.js modules**: `fs`, `path`, `crypto`, `buffer`
- **Only use**: Web APIs, ES2023 features, AWS SDK, `process.env`

### Testing
- **Never assume test framework** - check README or search codebase
- **Always run lint/typecheck** after changes if available

---

## ✅ Work Completion Review

**ALWAYS perform this review after completing any task:**

### 1. Architecture Compliance
- ✅ Routes contain only `createFileRoute` definitions
- ✅ Page logic is in `src/components/pages/*`
- ✅ Custom hooks encapsulate API calls
- ✅ Common components are properly extracted

### 2. Code Quality
- ✅ No `any` types - use specific types
- ✅ Prefer `undefined` over `null`
- ✅ Use TanStack Router for navigation
- ✅ Named functions in useEffect
- ✅ Curly braces for all if statements

### 3. Build & Type Check
- ✅ Run `npm run build` to verify no errors
- ✅ Run `npm run lint` if available
- ✅ Check for TypeScript errors

### 4. Project-Specific
- ✅ Unit suffixes on measurement variables
- ✅ Proper r3f unit conversion (meters)
- ✅ Canvas terminology is clear

**If any check fails, fix the issues before considering the task complete.**

---

## 📚 Project Tech Stack

React 19 + Vite + TanStack Router + TypeScript + Tailwind CSS + shadcn/ui + Vitest

**Key Features:**
- File-based routing with auto code-splitting
- Path aliases (`@/*` maps to `./src/*`)
- Strict TypeScript mode
- jsdom testing environment