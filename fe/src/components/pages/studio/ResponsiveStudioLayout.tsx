import { type ReactNode } from "react";

type ResponsiveStudioLayoutProps = {
  canvasArea: ReactNode;
  toolsArea: ReactNode;
  modeSelector: ReactNode;
  checkoutButton?: ReactNode;
  resetButton?: ReactNode;
};

export function ResponsiveStudioLayout({
  canvasArea,
  toolsArea,
  modeSelector,
  checkoutButton,
  resetButton,
}: ResponsiveStudioLayoutProps) {
  return (
    <>
      {/* Mobile/Tablet Layout (vertical stacking) */}
      <div className="lg:hidden flex flex-col h-full">
        {/* 1. Canvas Block */}
        <div className="flex-1 relative min-h-0">
          {canvasArea}
          {/* Mobile reset button - floating top-left */}
          {resetButton && (
            <div className="absolute top-4 left-4 z-20">
              {resetButton}
            </div>
          )}
          {/* Mobile checkout button - floating top-right */}
          {checkoutButton && (
            <div className="absolute top-4 right-4 z-20">
              {checkoutButton}
            </div>
          )}
        </div>

        {/* 2. Tools Block */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          {toolsArea}
        </div>

        {/* 3. Mode Selection Block */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 p-3">
          {modeSelector}
        </div>
      </div>

      {/* Desktop Layout (horizontal split) */}
      <div className="hidden lg:flex h-full">
        {/* Left: Canvas Block */}
        <div className="w-1/2 relative">
          {canvasArea}
        </div>

        {/* Right: Tools + Mode Selection + Checkout */}
        <div className="w-1/2 flex flex-col bg-white border-l border-gray-200">
          {/* Desktop buttons - top block */}
          {(checkoutButton || resetButton) && (
            <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200 flex justify-between">
              <div>{resetButton}</div>
              <div>{checkoutButton}</div>
            </div>
          )}
          
          {/* Tools Block */}
          <div className="flex-1 p-4 overflow-y-auto">
            {toolsArea}
          </div>

          {/* Mode Selection Block */}
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 p-3">
            {modeSelector}
          </div>
        </div>
      </div>
    </>
  );
}