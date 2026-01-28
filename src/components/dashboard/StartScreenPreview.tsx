import { ShuffleText, FuzzyText, DecryptedText, ASCIIText } from '@/components/profile/TextAnimations';
import ASCIITextEffect from '@/components/profile/ASCIITextEffect';
import DecryptedTextEffect from '@/components/profile/DecryptedTextEffect';
import FuzzyTextEffect from '@/components/profile/FuzzyTextEffect';
import ShuffleTextEffect from '@/components/profile/ShuffleTextEffect';

interface StartScreenPreviewProps {
  text: string;
  animation: string;
  font: string;
  textColor: string;
  bgColor: string;
  asciiSize?: number;
  asciiWaves?: boolean;
}

export function StartScreenPreview({
  text,
  animation,
  font,
  textColor,
  bgColor,
  asciiSize = 8,
  asciiWaves = true,
}: StartScreenPreviewProps) {
  const displayText = text || 'Click anywhere to enter';
  const style = { fontFamily: font, color: textColor };

  const renderAnimation = () => {
    switch (animation) {
      case 'shuffle':
        return <ShuffleText text={displayText} style={style} className="text-lg md:text-xl" />;
      case 'shuffle-gsap':
        return (
          <ShuffleTextEffect
            text={displayText}
            style={{ ...style, fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            stagger={0.03}
            triggerOnHover={true}
            autoPlay={true}
            loop={false}
          />
        );
      case 'fuzzy':
        return <FuzzyText text={displayText} style={style} className="text-lg md:text-xl" />;
      case 'decrypted':
        return <DecryptedText text={displayText} style={style} className="text-lg md:text-xl" />;
      case 'ascii':
        return <ASCIIText text={displayText} style={style} className="text-lg md:text-xl" />;
      case 'ascii-3d':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div 
              className="relative"
              style={{ 
                width: 'min(100%, 350px)', 
                height: '120px',
              }}
            >
              <ASCIITextEffect
                text={displayText}
                textColor={textColor}
                enableWaves={asciiWaves}
                asciiFontSize={asciiSize}
                textFontSize={asciiSize * 12}
                planeBaseHeight={6}
              />
            </div>
          </div>
        );
      case 'decrypted-advanced':
        return (
          <DecryptedTextEffect
            text={displayText}
            speed={50}
            sequential={true}
            revealDirection="start"
            animateOn="view"
            className="text-lg md:text-xl"
            style={style}
          />
        );
      case 'fuzzy-canvas':
        return (
          <div className="flex items-center justify-center">
            <FuzzyTextEffect
              fontSize="clamp(1rem, 2vw, 1.5rem)"
              fontWeight={600}
              color={textColor}
              baseIntensity={0.2}
              hoverIntensity={0.5}
              enableHover={true}
              glitchMode={true}
              glitchInterval={3000}
              glitchDuration={200}
            >
              {displayText}
            </FuzzyTextEffect>
          </div>
        );
      default:
        return (
          <span className="text-lg md:text-xl" style={style}>
            {displayText}
            <span className="animate-pulse">|</span>
          </span>
        );
    }
  };

  return (
    <div
      className="rounded-xl border border-border/50 overflow-hidden transition-all duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <div className="p-2 border-b border-border/30 bg-black/20 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2">Start Screen Preview</span>
      </div>
      <div 
        className="flex items-center justify-center text-center px-4"
        style={{ 
          minHeight: animation === 'ascii-3d' ? '160px' : '120px',
        }}
      >
        {renderAnimation()}
      </div>
    </div>
  );
}
