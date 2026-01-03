/**
 * Responsive utility hooks for adaptive UI
 */

"use client";

import { useState, useEffect } from "react";

// Breakpoints matching Tailwind defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect current screen size
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook to check if screen is at or above a breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const minWidth = BREAKPOINTS[breakpoint];
  return useMediaQuery(`(min-width: ${minWidth}px)`);
}

/**
 * Hook to get current breakpoint
 */
export function useCurrentBreakpoint(): Breakpoint | null {
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS["2xl"]}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return null; // Mobile (xs)
}

/**
 * Hook to detect mobile devices
 */
export function useIsMobile(): boolean {
  return !useBreakpoint("md");
}

/**
 * Hook to detect tablet devices
 */
export function useIsTablet(): boolean {
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  return isMd && !isLg;
}

/**
 * Hook to detect desktop devices
 */
export function useIsDesktop(): boolean {
  return useBreakpoint("lg");
}

/**
 * Hook to detect touch devices
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Hook to get window dimensions
 */
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

/**
 * Hook to detect orientation
 */
export function useOrientation(): "portrait" | "landscape" {
  const { width, height } = useWindowSize();
  return height > width ? "portrait" : "landscape";
}

/**
 * Hook to detect if element is in viewport
 */
export function useInViewport(ref: React.RefObject<HTMLElement>): boolean {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [ref]);

  return isInViewport;
}
