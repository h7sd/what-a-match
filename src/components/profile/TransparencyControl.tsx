import { Eye } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface TransparencyControlProps {
  transparency: number;
  onTransparencyChange: (value: number) => void;
  accentColor?: string;
}

export function TransparencyControl({ 
  transparency, 
  onTransparencyChange, 
  accentColor = '#8B5CF6' 
}: TransparencyControlProps) {
  const handleChange = (value: number[]) => {
    onTransparencyChange(value[0]);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
      <Eye className="w-5 h-5 text-white/80" />
      
      <Slider
        value={[transparency]}
        onValueChange={handleChange}
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
