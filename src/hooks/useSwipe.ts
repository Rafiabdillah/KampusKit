import { useState, TouchEvent } from 'react';

interface SwipeInput {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 }: SwipeInput) {
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isLeftSwipe = distanceX > threshold;
        const isRightSwipe = distanceX < -threshold;
        const isUpSwipe = distanceY > threshold;
        const isDownSwipe = distanceY < -threshold;

        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            // Horizontal swipe
            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            } else if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }
        } else {
            // Vertical swipe
            if (isUpSwipe && onSwipeUp) {
                onSwipeUp();
            } else if (isDownSwipe && onSwipeDown) {
                onSwipeDown();
            }
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
}
