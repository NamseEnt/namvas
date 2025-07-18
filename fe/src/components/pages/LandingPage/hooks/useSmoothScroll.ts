import { useCallback } from "react";

export function useSmoothScroll() {
  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const href = e.currentTarget.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const elementId = href.substring(1);
        scrollToElement(elementId);
      }
    },
    [scrollToElement]
  );

  return { scrollToElement, handleAnchorClick };
}