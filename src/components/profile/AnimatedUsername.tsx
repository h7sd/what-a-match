import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

export type UsernameEffect = 
  | 'none'
  | 'rainbow'
  | 'glow-pulse'
  | 'wave'
  | 'shine'
  | 'glitch'
  | 'typewriter'
  | 'sparkle'
  | 'neon-flicker'
  | 'gradient-shift';

interface AnimatedUsernameProps {
  text: string;
  effect?: UsernameEffect;
  accentColor?: string;
  className?: string;
  fontFamily?: string;
  enableRainbow?: boolean;
  enableGlow?: boolean;
  enableTypewriter?: boolean;
  enableGlitch?: boolean;
  enableSparkles?: boolean;
}

export function AnimatedUsername({
  text,
  effect = 'none',
  accentColor = '#8b5cf6',
  className = '',
  fontFamily = 'Inter',
  enableRainbow = false,
  enableGlow = false,
  enableTypewriter = false,
  enableGlitch = false,
  enableSparkles = false,
}: AnimatedUsernameProps) {
  // Combine effects - typewriter is the base, others layer on top
  const hasTypewriter = enableTypewriter;
  const hasRainbow = enableRainbow;
  const hasGlow = enableGlow;
  const hasGlitch = enableGlitch;
  const hasSparkles = enableSparkles;

  // If typewriter is enabled, use combined effect
  if (hasTypewriter) {
    return (
      <CombinedTypewriterEffect
        text={text}
        className={className}
        fontFamily={fontFamily}
        accentColor={accentColor}
        enableRainbow={hasRainbow}
        enableGlow={hasGlow}
        enableGlitch={hasGlitch}
        enableSparkles={hasSparkles}
      />
    );
  }

  // Single effects without typewriter
  if (hasRainbow) {
    return (
      <RainbowText 
        text={text} 
        className={className} 
        fontFamily={fontFamily}
        enableGlow={hasGlow}
        enableSparkles={hasSparkles}
        accentColor={accentColor}
      />
    );
  }

  if (hasGlow) {
    return (
      <GlowPulseText 
        text={text} 
        accentColor={accentColor} 
        className={className} 
        fontFamily={fontFamily}
        enableSparkles={hasSparkles}
      />
    );
  }

  if (hasGlitch) {
    return <GlitchTextEffect text={text} className={className} fontFamily={fontFamily} />;
  }

  if (hasSparkles) {
    return <SparkleText text={text} accentColor={accentColor} className={className} fontFamily={fontFamily} />;
  }

  // Fallback to effect prop
  switch (effect) {
    case 'rainbow':
      return <RainbowText text={text} className={className} fontFamily={fontFamily} accentColor={accentColor} />;
    case 'glow-pulse':
      return <GlowPulseText text={text} accentColor={accentColor} className={className} fontFamily={fontFamily} />;
    case 'wave':
      return <WaveText text={text} accentColor={accentColor} className={className} fontFamily={fontFamily} />;
    case 'shine':
      return <ShineText text={text} className={className} fontFamily={fontFamily} />;
    case 'glitch':
      return <GlitchTextEffect text={text} className={className} fontFamily={fontFamily} />;
    case 'typewriter':
      return <TypewriterText text={text} className={className} fontFamily={fontFamily} />;
    case 'sparkle':
      return <SparkleText text={text} accentColor={accentColor} className={className} fontFamily={fontFamily} />;
    case 'neon-flicker':
      return <NeonFlickerText text={text} accentColor={accentColor} className={className} fontFamily={fontFamily} />;
    case 'gradient-shift':
      return <GradientShiftText text={text} className={className} fontFamily={fontFamily} />;
    default:
      return <span className={className} style={{ fontFamily, color: 'white' }}>{text}</span>;
  }
}

// Combined Typewriter with other effects
function CombinedTypewriterEffect({
  text,
  className,
  fontFamily,
  accentColor,
  enableRainbow,
  enableGlow,
  enableGlitch,
  enableSparkles,
}: {
  text: string;
  className: string;
  fontFamily: string;
  accentColor: string;
  enableRainbow?: boolean;
  enableGlow?: boolean;
  enableGlitch?: boolean;
  enableSparkles?: boolean;
}) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'deleting'>('typing');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (phase === 'typing') {
      if (displayText.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase('waiting'), 2500);
      }
    } else if (phase === 'waiting') {
      timeout = setTimeout(() => setPhase('deleting'), 1000);
    } else if (phase === 'deleting') {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        timeout = setTimeout(() => setPhase('typing'), 500);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, text, phase]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Build combined styles
  const getTextStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = { fontFamily };

    if (enableRainbow) {
      return {
        ...style,
        background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'rainbow-scroll 3s linear infinite',
      };
    }

    if (enableGlow) {
      return {
        ...style,
        color: 'white',
        textShadow: `0 0 10px ${accentColor}80, 0 0 20px ${accentColor}40, 0 0 30px ${accentColor}20`,
        animation: 'glow-pulse 2s ease-in-out infinite',
      };
    }

    return { ...style, color: 'white' };
  };

  const sparkles = useMemo(() => 
    enableSparkles ? Array.from({ length: 4 }, (_, i) => ({
      id: i,
      left: `${15 + Math.random() * 70}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
    })) : [], [enableSparkles]);

  return (
    <span className={`${className} inline-block relative`}>
      <style>{`
        @keyframes rainbow-scroll {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 10px ${accentColor}40, 0 0 20px ${accentColor}20; }
          50% { text-shadow: 0 0 20px ${accentColor}80, 0 0 40px ${accentColor}40, 0 0 60px ${accentColor}20; }
        }
      `}</style>
      
      <motion.span
        style={getTextStyle()}
        animate={enableGlitch ? {
          x: [0, -1, 1, 0],
        } : {}}
        transition={enableGlitch ? { duration: 0.1, repeat: Infinity, repeatDelay: 2.5 } : {}}
      >
        {displayText}
      </motion.span>
      
      <span 
        className="transition-opacity duration-100"
        style={{ 
          opacity: showCursor ? 1 : 0,
          color: enableRainbow ? '#8b5cf6' : 'white',
        }}
      >
        |
      </span>

      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute pointer-events-none text-xs"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            color: accentColor,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: sparkle.delay,
          }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  );
}

// Rainbow Gradient - with optional glow and sparkles
function RainbowText({ 
  text, 
  className, 
  fontFamily,
  enableGlow,
  enableSparkles,
  accentColor = '#8b5cf6',
}: { 
  text: string; 
  className: string; 
  fontFamily: string;
  enableGlow?: boolean;
  enableSparkles?: boolean;
  accentColor?: string;
}) {
  const sparkles = useMemo(() => 
    enableSparkles ? Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
    })) : [], [enableSparkles]);

  return (
    <span className={`${className} inline-block relative`}>
      <motion.span
        className="inline-block"
        style={{
          fontFamily,
          background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: enableGlow ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' : undefined,
        }}
        animate={{
          backgroundPosition: ['0% 50%', '200% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {text}
      </motion.span>
      
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute pointer-events-none text-xs"
          style={{ left: sparkle.left, top: sparkle.top, color: accentColor }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: sparkle.delay }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  );
}

// Glow Pulse
function GlowPulseText({ 
  text, 
  accentColor, 
  className, 
  fontFamily,
  enableSparkles,
}: { 
  text: string; 
  accentColor: string; 
  className: string; 
  fontFamily: string;
  enableSparkles?: boolean;
}) {
  const sparkles = useMemo(() => 
    enableSparkles ? Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
    })) : [], [enableSparkles]);

  return (
    <span className={`${className} inline-block relative`}>
      <motion.span
        className="inline-block"
        style={{ fontFamily, color: 'white' }}
        animate={{
          textShadow: [
            `0 0 10px ${accentColor}40, 0 0 20px ${accentColor}20`,
            `0 0 20px ${accentColor}80, 0 0 40px ${accentColor}40, 0 0 60px ${accentColor}20`,
            `0 0 10px ${accentColor}40, 0 0 20px ${accentColor}20`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {text}
      </motion.span>
      
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute pointer-events-none text-xs"
          style={{ left: sparkle.left, top: sparkle.top, color: accentColor }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: sparkle.delay }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  );
}

// Wave Text
function WaveText({ text, accentColor, className, fontFamily }: { text: string; accentColor: string; className: string; fontFamily: string }) {
  return (
    <span className={`${className} inline-flex`} style={{ fontFamily }}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          style={{ 
            color: 'white',
            textShadow: `0 0 10px ${accentColor}40`,
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// Shine Text
function ShineText({ text, className, fontFamily }: { text: string; className: string; fontFamily: string }) {
  return (
    <motion.span
      className={`${className} inline-block relative overflow-hidden`}
      style={{
        fontFamily,
        color: 'white',
        background: 'linear-gradient(90deg, white 0%, white 40%, #ffd700 50%, white 60%, white 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
      animate={{ backgroundPosition: ['-100% 0%', '200% 0%'] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
        repeatDelay: 1,
      }}
    >
      {text}
    </motion.span>
  );
}

// Glitch Text Effect
function GlitchTextEffect({ text, className, fontFamily }: { text: string; className: string; fontFamily: string }) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      className={`${className} inline-block relative`}
      style={{ fontFamily, color: 'white' }}
      animate={isGlitching ? {
        x: [0, -3, 3, -2, 2, 0],
        textShadow: [
          '0 0 0 transparent',
          '-3px 0 0 #ff0000, 3px 0 0 #00ffff',
          '3px 0 0 #ff0000, -3px 0 0 #00ffff',
          '-2px 0 0 #ff0000, 2px 0 0 #00ffff',
          '0 0 0 transparent',
        ],
      } : {}}
      transition={{ duration: 0.2 }}
    >
      {text}
      {isGlitching && (
        <>
          <motion.span
            className="absolute inset-0"
            style={{ 
              fontFamily, 
              color: '#ff0000', 
              opacity: 0.8,
              clipPath: 'inset(20% 0 30% 0)',
            }}
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 0.1 }}
          >
            {text}
          </motion.span>
          <motion.span
            className="absolute inset-0"
            style={{ 
              fontFamily, 
              color: '#00ffff', 
              opacity: 0.8,
              clipPath: 'inset(60% 0 10% 0)',
            }}
            animate={{ x: [2, -2, 2] }}
            transition={{ duration: 0.1 }}
          >
            {text}
          </motion.span>
        </>
      )}
    </motion.span>
  );
}

// Simple Typewriter (without combinations)
function TypewriterText({ text, className, fontFamily }: { text: string; className: string; fontFamily: string }) {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'deleting'>('typing');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (phase === 'typing') {
      if (displayText.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayText(text.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase('waiting'), 2500);
      }
    } else if (phase === 'waiting') {
      timeout = setTimeout(() => setPhase('deleting'), 1000);
    } else if (phase === 'deleting') {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        timeout = setTimeout(() => setPhase('typing'), 500);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, text, phase]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={`${className} inline-block`} style={{ fontFamily, color: 'white' }}>
      {displayText}
      <span className={showCursor ? 'opacity-100' : 'opacity-0'}>|</span>
    </span>
  );
}

// Sparkle Text
function SparkleText({ text, accentColor, className, fontFamily }: { text: string; accentColor: string; className: string; fontFamily: string }) {
  const sparkles = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
    })), []);

  return (
    <span className={`${className} inline-block relative`} style={{ fontFamily, color: 'white' }}>
      {text}
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute pointer-events-none text-xs"
          style={{ left: sparkle.left, top: sparkle.top, color: accentColor }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: sparkle.delay }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  );
}

// Neon Flicker
function NeonFlickerText({ text, accentColor, className, fontFamily }: { text: string; accentColor: string; className: string; fontFamily: string }) {
  return (
    <motion.span
      className={`${className} inline-block`}
      style={{
        fontFamily,
        color: accentColor,
        textShadow: `0 0 5px ${accentColor}, 0 0 10px ${accentColor}, 0 0 20px ${accentColor}, 0 0 40px ${accentColor}`,
      }}
      animate={{
        opacity: [1, 0.8, 1, 0.9, 1, 0.85, 1],
        textShadow: [
          `0 0 5px ${accentColor}, 0 0 10px ${accentColor}, 0 0 20px ${accentColor}, 0 0 40px ${accentColor}`,
          `0 0 2px ${accentColor}, 0 0 5px ${accentColor}, 0 0 10px ${accentColor}`,
          `0 0 5px ${accentColor}, 0 0 10px ${accentColor}, 0 0 20px ${accentColor}, 0 0 40px ${accentColor}`,
          `0 0 3px ${accentColor}, 0 0 8px ${accentColor}, 0 0 15px ${accentColor}`,
          `0 0 5px ${accentColor}, 0 0 10px ${accentColor}, 0 0 20px ${accentColor}, 0 0 40px ${accentColor}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 1],
      }}
    >
      {text}
    </motion.span>
  );
}

// Gradient Shift
function GradientShiftText({ text, className, fontFamily }: { text: string; className: string; fontFamily: string }) {
  return (
    <motion.span
      className={`${className} inline-block`}
      style={{
        fontFamily,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #667eea 100%)',
        backgroundSize: '300% 300%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {text}
    </motion.span>
  );
}
