import { useRef, useCallback, useState } from 'react';

interface TiltValues {
  rotateX: number;
  rotateY: number;
  scale: number;
}

/**
 * useTilt — Professional 3D tilt effect for cards
 * 
 * Returns a ref to attach to the element, tilt values for inline style,
 * and event handlers for mouse enter/move/leave.
 * 
 * Designed for restrained, premium motion:
 * - Max 4° rotation (not disorienting)
 * - Smooth cubic-bezier easing
 * - 1.02 scale on hover (subtle lift)
 */
export function useTilt(maxTilt = 4) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltValues>({ rotateX: 0, rotateY: 0, scale: 1 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalized position from -1 to 1
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
    
    // Invert Y for natural "physical card" feel
    setTilt({
      rotateX: -normalizedY * maxTilt,
      rotateY: normalizedX * maxTilt,
      scale: 1.02,
    });
  }, [maxTilt]);

  const handleMouseEnter = useCallback(() => {
    // Scale is set by handleMouseMove
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  }, []);

  const tiltStyle: React.CSSProperties = {
    transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
    transition: tilt.scale === 1 
      ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
      : 'transform 0.15s ease-out',
  };

  return {
    ref,
    tiltStyle,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
