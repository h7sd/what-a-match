import { motion } from 'framer-motion';
import { VolumeControl } from './VolumeControl';
import { TransparencyControl } from './TransparencyControl';

interface ControlsBarProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  transparency: number;
  onTransparencyChange: (transparency: number) => void;
  accentColor?: string;
}

export function ControlsBar({
  volume,
  onVolumeChange,
  transparency,
  onTransparencyChange,
  accentColor = '#8B5CF6',
}: ControlsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4"
    >
      <VolumeControl 
        volume={volume} 
        onVolumeChange={onVolumeChange} 
        accentColor={accentColor}
      />
      <TransparencyControl 
        transparency={transparency} 
        onTransparencyChange={onTransparencyChange}
        accentColor={accentColor} 
      />
    </motion.div>
  );
}
