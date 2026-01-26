import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlitchOverlayProps {
  active?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlitchOverlay({ active = false, intensity = 'low' }: GlitchOverlayProps) {
  const [glitchLines, setGlitchLines] = useState<Array<{ id: number; top: number; height: number }>>([]);

  useEffect(() => {
    if (!active) return;

    const intervals = {
      low: 3000,
      medium: 1500,
      high: 500,
    };

    const interval = setInterval(() => {
      const newLines = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
        id: Date.now() + i,
        top: Math.random() * 100,
        height: Math.random() * 5 + 1,
      }));
      
      setGlitchLines(newLines);
      
      setTimeout(() => setGlitchLines([]), 150);
    }, intervals[intensity]);

    return () => clearInterval(interval);
  }, [active, intensity]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 mix-blend-color-dodge">
      <AnimatePresence>
        {glitchLines.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.5, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 right-0"
            style={{
              top: `${line.top}%`,
              height: `${line.height}px`,
              background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.3), rgba(0,255,255,0.3), transparent)',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
