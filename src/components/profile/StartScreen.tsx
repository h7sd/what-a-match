import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StartScreenProps {
  onStart: () => void;
  message?: string;
}

export function StartScreen({ onStart, message = "Click anywhere to enter" }: StartScreenProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [message]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onStart, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
          onClick={handleClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-8"
              style={{
                background: 'linear-gradient(to right, hsl(var(--primary)), #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
              }}
            >
              UserVault
            </motion.h1>
            
            <p className="text-xl text-muted-foreground font-mono">
              {displayedText}
              <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>|</span>
            </p>

            <motion.div
              className="mt-12 w-16 h-16 mx-auto rounded-full border-2 border-primary/50"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
