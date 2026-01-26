import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchIntensity?: number;
  typewriter?: boolean;
  typewriterSpeed?: number;
  loop?: boolean;
}

export function GlitchText({ 
  text, 
  className = '', 
  glitchIntensity = 0.1,
  typewriter = false,
  typewriterSpeed = 150,
  loop = false,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(typewriter ? '' : text);
  const [isGlitching, setIsGlitching] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (!typewriter) {
      setDisplayText(text);
      return;
    }

    let index = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      if (!isDeleting && index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
        timeoutId = setTimeout(type, typewriterSpeed);
      } else if (isDeleting && index > 0) {
        setDisplayText(text.slice(0, index - 1));
        index--;
        timeoutId = setTimeout(type, typewriterSpeed / 2);
      } else if (loop && index === text.length) {
        isDeleting = true;
        timeoutId = setTimeout(type, 2000);
      } else if (loop && index === 0) {
        isDeleting = false;
        timeoutId = setTimeout(type, 500);
      }
    };

    timeoutId = setTimeout(type, 500);

    return () => clearTimeout(timeoutId);
  }, [text, typewriter, typewriterSpeed, loop]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < glitchIntensity) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }
    }, 1000);

    return () => clearInterval(glitchInterval);
  }, [glitchIntensity]);

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      animate={isGlitching ? {
        x: [0, -2, 2, -1, 1, 0],
        textShadow: [
          '0 0 0 transparent',
          '-2px 0 0 #ff0000, 2px 0 0 #00ffff',
          '2px 0 0 #ff0000, -2px 0 0 #00ffff',
          '0 0 0 transparent',
        ],
      } : {}}
      transition={{ duration: 0.2 }}
    >
      {displayText}
      {typewriter && (
        <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>|</span>
      )}
    </motion.span>
  );
}
