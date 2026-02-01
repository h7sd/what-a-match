import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CursorPosition {
  x: number;
  y: number;
}

interface Trail {
  id: number;
  x: number;
  y: number;
}

interface CustomCursorProps {
  color?: string;
  showTrail?: boolean;
  cursorUrl?: string;
}

// Check cursor format type
function getCursorType(url: string): 'cur' | 'ani' | 'image' | 'none' {
  if (!url) return 'none';
  const lower = url.toLowerCase();
  if (lower.endsWith('.cur')) return 'cur';
  if (lower.endsWith('.ani')) return 'ani';
  if (lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.apng')) return 'image';
  return 'image'; // Default to image for unknown types
}

export function CustomCursor({ color = '#8b5cf6', showTrail = true, cursorUrl }: CustomCursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [trails, setTrails] = useState<Trail[]>([]);
  const trailIdRef = useRef(0);

  const cursorType = getCursorType(cursorUrl || '');
  
  // .cur files work via CSS cursor property in all modern browsers
  // .ani files do NOT work in modern browsers - show fallback styled cursor
  // .png/.gif files use overlay image approach
  const useCssCursor = cursorType === 'cur';
  const useImageCursor = cursorType === 'image';
  const showFallbackCursor = cursorType === 'ani' || cursorType === 'none';

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      if (showTrail) {
        const newTrail: Trail = {
          id: trailIdRef.current++,
          x: e.clientX,
          y: e.clientY,
        };
        setTrails((prev) => [...prev.slice(-12), newTrail]);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [showTrail]);

  // Clean up old trails
  useEffect(() => {
    const interval = setInterval(() => {
      setTrails((prev) => prev.slice(-8));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (typeof window === 'undefined') return null;

  // For .cur files, use CSS cursor property (works in all modern browsers)
  if (useCssCursor && cursorUrl) {
    return (
      <>
        <style>{`
          * { cursor: url('${cursorUrl}'), auto !important; }
        `}</style>
        
        {/* Trail still works with native cursors */}
        <AnimatePresence>
          {showTrail && trails.map((trail) => (
            <motion.div
              key={trail.id}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed pointer-events-none z-[9998]"
              style={{
                left: trail.x - 4,
                top: trail.y - 4,
                width: 8,
                height: 8,
                backgroundColor: color,
                borderRadius: '50%',
                filter: 'blur(2px)',
              }}
            />
          ))}
        </AnimatePresence>
      </>
    );
  }

  // For image cursors (.png, .gif) OR fallback (.ani which doesn't work in browsers)
  const showOverlayImage = useImageCursor && cursorUrl;

  return (
    <>
      <style>{`
        * { cursor: none !important; }
      `}</style>
      
      {/* Trail */}
      <AnimatePresence>
        {showTrail && trails.map((trail) => (
          <motion.div
            key={trail.id}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed pointer-events-none z-[9998]"
            style={{
              left: trail.x - 4,
              top: trail.y - 4,
              width: 8,
              height: 8,
              backgroundColor: color,
              borderRadius: '50%',
              filter: 'blur(2px)',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Main cursor */}
      {isVisible && (
        <>
          {useImageCursor ? (
            // Custom image cursor (png, gif)
            <motion.img
              src={cursorUrl}
              alt="cursor"
              className="fixed pointer-events-none z-[9999]"
              style={{
                left: position.x - 16,
                top: position.y - 16,
                width: 32,
                height: 32,
                objectFit: 'contain',
              }}
            />
          ) : (
            <>
              {/* Outer ring */}
              <motion.div
                className="fixed pointer-events-none z-[9999] rounded-full border-2"
                style={{
                  borderColor: color,
                  width: 32,
                  height: 32,
                  left: position.x - 16,
                  top: position.y - 16,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              {/* Inner dot */}
              <motion.div
                className="fixed pointer-events-none z-[9999] rounded-full"
                style={{
                  backgroundColor: color,
                  width: 6,
                  height: 6,
                  left: position.x - 3,
                  top: position.y - 3,
                  boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
                }}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
