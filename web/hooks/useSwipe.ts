import { useEffect, useRef, useState } from "react";

interface SwipeInput {
    onSwipedLeft?: () => void;
    onSwipedRight?: () => void;
    onSwipedUp?: () => void;
    onSwipedDown?: () => void;
}

interface SwipeOutput {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

export const useSwipe = (
    { onSwipedLeft, onSwipedRight, onSwipedUp, onSwipedDown }: SwipeInput,
): SwipeOutput => {
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const touchEndY = useRef<number | null>(null);

    // Minimum distance required for a swipe (px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        touchEndX.current = null;
        touchEndY.current = null;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
        touchEndY.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = () => {
        if (
            !touchStartX.current || !touchEndX.current ||
            !touchStartY.current || !touchEndY.current
        ) return;

        const xDistance = touchStartX.current - touchEndX.current;
        const yDistance = touchStartY.current - touchEndY.current;
        const isHorizontalSearch = Math.abs(xDistance) > Math.abs(yDistance);

        if (isHorizontalSearch) {
            if (Math.abs(xDistance) < minSwipeDistance) return;
            if (xDistance > 0) {
                onSwipedLeft && onSwipedLeft();
            } else {
                onSwipedRight && onSwipedRight();
            }
        } else {
            if (Math.abs(yDistance) < minSwipeDistance) return;
            if (yDistance > 0) {
                onSwipedUp && onSwipedUp();
            } else {
                onSwipedDown && onSwipedDown();
            }
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    };
};
