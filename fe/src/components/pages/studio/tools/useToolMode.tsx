import { createContext, useContext, useState, type ReactNode } from "react";

export type ToolMode = "view" | "image" | "background" | "edit";

type ToolModeContextType = {
  currentMode: ToolMode;
  setMode: (mode: ToolMode) => void;
};

const ToolModeContext = createContext<ToolModeContextType>(null!);

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
  return useContext(ToolModeContext);
}