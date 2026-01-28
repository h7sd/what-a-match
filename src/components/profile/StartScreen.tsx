import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShuffleText, FuzzyText, DecryptedText, ASCIIText } from './TextAnimations';

interface StartScreenProps {
  onStart: () => void;
  message?: string;
  font?: string;
  textColor?: string;
  bgColor?: string;
  textAnimation?: string;
}

function AnimatedText({ 
  text, 
  animation, 
  font, 
  color 
}: { 
  text: string; 
  animation: string; 
  font: string; 
  color: string;
}) {
  const style = { fontFamily: font, color };
  
  switch (animation) {
    case 'shuffle':
      return <ShuffleText text={text} style={style} className="text-xl" />;
    case 'fuzzy':
      return <FuzzyText text={text} style={style} className="text-xl" />;
    case 'decrypted':
      return <DecryptedText text={text} style={style} className="text-xl" />;
    case 'ascii':
      return <ASCIIText text={text} style={style} className="text-xl" />;
    default:
      return null; // Will use typewriter fallback
  }
}

export function StartScreen({ 
  onStart, 
  message = "Click anywhere to enter",
  font = "Inter",
  textColor = "#a855f7",
  bgColor = "#000000",
  textAnimation = "none"
}: StartScreenProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  
  const useTypewriter = textAnimation === 'none';

  useEffect(() => {
    if (!useTypewriter) {
      setDisplayedText(message);
      return;
    }
    
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
  }, [message, useTypewriter]);

  useEffect(() => {
    if (!useTypewriter) return;
    
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [useTypewriter]);

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
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: bgColor }}
          onClick={handleClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {useTypewriter ? (
              <p 
                className="text-xl"
                style={{ 
                  fontFamily: font,
                  color: textColor,
                }}
              >
                {displayedText}
                <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>|</span>
              </p>
            ) : (
              <AnimatedText 
                text={message}
                animation={textAnimation}
                font={font}
                color={textColor}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
