# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Terminology

### Canvas Naming Convention

- **CanvasProduct**: Refers to the physical canvas frame product sold on this website
- **CanvasElement**: Refers to HTML `<canvas>` element for drawing/graphics
- **Never use "Canvas" alone**: Always clarify which type you mean

When user mentions "Canvas" or "캔버스" without context, ask: "Do you mean CanvasProduct (the physical frame product) or CanvasElement (HTML canvas element)?"

## Project Architecture

This is a React 19 application built with:

- **Vite** as the build tool and dev server
- **TanStack Router** for file-based routing with auto code-splitting enabled
- **TypeScript** with strict mode and path aliases (`@/*` maps to `./src/*`)
- **Tailwind CSS + shadcn/ui** for styling and UI components
- **Vitest** for testing with jsdom environment

### Routing Structure

- Uses TanStack Router with file-based routing in `src/routes/`
- Routes are automatically generated from files in the routes directory
- Root layout is in `src/routes/__root.tsx`
- Route tree is auto-generated in `routeTree.gen.ts`
- Router includes dev tools, scroll restoration, and intent-based preloading

### Key Files

- `src/main.tsx`: Application entry point with router setup
- `src/routes/__root.tsx`: Root layout component with Outlet for nested routes
- `src/reportWebVitals.ts`: Performance monitoring utilities

### TypeScript Configuration

- ES2022 target with strict typing enabled
- Path alias `@/*` configured for `src/` imports
- Bundler module resolution with import extensions allowed
- No emit mode (handled by Vite)

### UI Components & Styling

- **shadcn/ui** components located in `src/components/ui/`
- **Tailwind CSS** for utility-first styling with custom design tokens
- CSS variables defined in `src/styles.css` for consistent theming
- Utility function `cn()` in `src/lib/utils.ts` for conditional class merging

#### shadcn/ui Component Installation

- **NEVER manually write shadcn/ui components**: Always use the CLI to install them
- **Use `npx shadcn@latest add <component-name>`**: This is the correct way to add components
- **Components are installed, not written**: shadcn/ui components should be installed using the official CLI tool
- **Example**: `npx shadcn@latest add card checkbox input label textarea`

### Testing

- Vitest configured with jsdom for DOM testing
- Testing Library React available for component testing
- Global test utilities configured in Vite config

### Component Structure

- **Private sub-components**: Create sub-components within the same file, not in shared components
- **Component-specific**: Sub-components are for that specific component only, not for reuse across different components
- **Large sub-components**: If a sub-component becomes complex (over 50 lines) or has significant functionality, extract it to a separate `.tsx` file in the same directory

## Code Style Rules

### File Structure

- **Exports**: Always at top of file
- **Private components**: At bottom of file
- **Exception**: Simple types/constants (under 8 lines) can go before exports

### React Components

- Use `function` declarations, not `const`
- Props: Define inline, no separate type definitions
- `export default`: Declare with function, not at file bottom
- **Component size limit**: Main components should not exceed 50 lines. Break into sub-components if larger
- **Sub-component separation**: Create sub-components based on Figma data-name attributes for better organization

### TypeScript

- Props: Inline types only
- No separate Props interfaces
- Prefer `type` over `interface`
- Use `type` for React Props

### Control Flow

- **Always use curly braces**: Even for single-line if statements, use `if () { return a; }` instead of `if () return a;`
- **All if statements must use braces**: Never write `if (condition) doSomething();` - always write `if (condition) { doSomething(); }`

### useEffect Style

- **Use named functions instead of arrow functions**: Makes the purpose of each effect clear
- **Function name should describe what the effect does**

```tsx
// ✅ Correct - Named function describes the effect's purpose
useEffect(function updateCameraDistance() {
  const distance = baseCameraDistance + Math.abs(rotation.y) * multiplier;
  setCameraDistance(distance);
}, [rotation.y]);

useEffect(function initializeThreeJS() {
  RectAreaLightUniformsLib.init();
}, []);

useEffect(function handleWindowResize() {
  const handleResize = () => setWindowSize(window.innerWidth);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// ❌ Wrong - Arrow function gives no context about what the effect does
useEffect(() => {
  const distance = baseCameraDistance + Math.abs(rotation.y) * multiplier;
  setCameraDistance(distance);
}, [rotation.y]);

useEffect(() => {
  RectAreaLightUniformsLib.init();
}, []);
```

## Component Internal Context Pattern

### When to Use

- Multiple sub-components in one file with props drilling
- 3+ levels of prop passing required
- Internal state/functions need sharing within component

### Context Creation Pattern

```tsx
// ✅ Correct way - Use single state object
type ComponentState = {
  field1: string;
  field2: boolean;
  field3: number;
};

const ComponentNameContext = createContext<{
  state: ComponentState;
  updateState: (updates: Partial<ComponentState>) => void;
  handler1: () => void;
  handler2: (param: string) => void;
}>(null as any);

const useComponentNameContext = () => useContext(ComponentNameContext);
```

### Anti-Patterns to Avoid

```tsx
// ❌ Don't use multiple useState for related data
const [field1, setField1] = useState("");
const [field2, setField2] = useState(false);
const [field3, setField3] = useState(0);

// ❌ Don't create separate types
type ComponentNameContextType = { ... };

// ❌ Don't pass individual state values and setters
const ComponentNameContext = createContext<{
  field1: string;
  setField1: (value: string) => void;
  field2: boolean;
  setField2: (value: boolean) => void;
}>(null as any);

// ❌ Don't add undefined checks (internal use only)
const useComponentNameContext = () => {
  const context = useContext(ComponentNameContext);
  if (!context) throw new Error("...");
  return context;
};
```

### Implementation Example

```tsx
export default function MyComponent() {
  const [state, setState] = useState<MyComponentState>({
    field1: "",
    field2: false,
    field3: 0,
  });

  const updateState = (updates: Partial<MyComponentState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handler = () => {
    console.log(state);
  };

  return (
    <MyComponentContext.Provider
      value={{ state, updateState: updateState, handler }}
    >
      <div>
        <SubComponent1 />
        <SubComponent2 />
      </div>
    </MyComponentContext.Provider>
  );
}

function SubComponent1() {
  const { state, updateState, handler } = useMyComponentContext();
  return (
    <div onClick={handler}>
      <input
        value={state.field1}
        onChange={(e) => updateState({ field1: e.target.value })}
      />
    </div>
  );
}
```

### Core Principles

1. **Single state object**: Use one state object instead of multiple useState calls
2. **Partial updates**: Use `Partial<StateType>` for updateState to allow partial updates
3. **Inline types**: Define state type separately, context type inline
4. **null as any**: Initialize with `null as any` (no undefined checks needed)
5. **Simple hooks**: Return `useContext()` directly
6. **Local scope**: Use only within the component file
7. **No props**: Remove all props from sub-components

## Development Rules

### Package Management

- **Never install packages** without explicit permission

### Development Server

- **NEVER run `npm run dev` or any dev server commands** - the development server is usually already running and the user will handle this

### Styling

- **Tailwind CSS v4.1**: Use latest documentation
- **No tailwind.config.ts**: Not used in v4

### Git Commits

- **Commit messages**: Title only, no body

## TanStack Router Rules

### Navigation

- **NEVER use `window.location`**: Always use TanStack Router for navigation
- **Use `Link` component**: For declarative navigation
- **Use `useNavigate` hook**: For programmatic navigation
- **Type-safe routes**: Use proper params and search parameters

### Correct Navigation Methods

```tsx
// ✅ Correct - Using Link component
<Link to="/chat/$chatId" params={{ chatId: id }}>

// ✅ Correct - Using useNavigate hook
const navigate = useNavigate();
navigate({ to: "/chat/$chatId", params: { chatId: id } });

// ❌ Wrong - Never use window.location
window.location.href = `/chat/${id}`;
```
