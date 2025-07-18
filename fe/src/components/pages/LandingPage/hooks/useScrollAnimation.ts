import { useEffect, useRef } from "react";
import styles from "../LandingPage.module.css";

export function useScrollAnimation<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const elementRef = useRef<T>(null);

  useEffect(function setupIntersectionObserver() {
    const element = elementRef.current;
    if (!element) return;

    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
      ...options,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.inView);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // 초기 상태 설정
    element.style.opacity = "0";
    element.style.transform = "translateY(20px)";
    element.style.transition = "all 0.6s ease-out";

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return elementRef;
}