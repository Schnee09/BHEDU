'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeContainerProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

/**
 * Swipe-enabled container for mobile-friendly horizontal scrolling
 * Supports touch gestures and optional navigation arrows for desktop
 */
export function SwipeContainer({
  children,
  className,
  showArrows = true,
  onSwipeLeft,
  onSwipeRight,
}: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const checkScrollability = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollability);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, []);

  const scrollTo = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0]?.clientX;
    if (touchEnd === undefined) return;
    const diff = touchStart - touchEnd;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diff < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    setTouchStart(null);
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scrollTo('left')}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full glass-premium',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hide-mobile'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Swipe Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn('swipe-container flex gap-4', className)}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scrollTo('right')}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'w-10 h-10 rounded-full glass-premium',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hide-mobile'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

interface SwipeViewProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

/**
 * Swipeable view controller for mobile page/tab navigation
 */
export function SwipeView({ children, currentIndex, onIndexChange, className }: SwipeViewProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0]?.clientX;
    if (touchEnd === undefined) return;
    const diff = touchStart - touchEnd;
    const threshold = 80;

    if (diff > threshold && currentIndex < children.length - 1) {
      onIndexChange(currentIndex + 1);
    } else if (diff < -threshold && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
    setTouchStart(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn('overflow-hidden', className)}
    >
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="flex-shrink-0 w-full">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
