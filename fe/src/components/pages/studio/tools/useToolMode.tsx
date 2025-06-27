import { createContext, useContext, useState, ReactNode } from "react";

export type ToolMode = "view" | "image" | "background" | "edit";

type ToolModeContextType = {
  currentMode: ToolMode;
  setMode: (mode: ToolMode) => void;
};

const ToolModeContext = createContext<ToolModeContextType | null>(null);

export function ToolModeProvider({ children }: { children: ReactNode }) {
  const [currentMode, setCurrentMode] = useState<ToolMode>("edit");

  const setMode = (mode: ToolMode) => {
    setCurrentMode(mode);
  };

  return (
    <ToolModeContext.Provider value={{ currentMode, setMode }}>
      {children}
    </ToolModeContext.Provider>
  );
}

export function useToolMode() {
  const context = useContext(ToolModeContext);
  if (!context) {
    throw new Error("useToolMode must be used within ToolModeProvider");
  }
  return context;
}