import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  accentColor?: string;
}

export function VolumeControl({ volume, onVolumeChange, accentColor = '#8B5CF6' }: VolumeControlProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    onVolumeChange(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
      <button 
        onClick={handleMuteToggle}
        className="text-white/80 hover:text-white transition-colors"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>
      
      <Slider
        value={[isMuted ? 0 : volume]}
        onValueChange={handleVolumeChange}
        max={1}
        step={0.01}
        className="w-20"
        style={{
          '--slider-color': accentColor,
        } as React.CSSProperties}
      />
    </div>
  );
}
