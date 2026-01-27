import { motion } from 'framer-motion';
import { Home, Terminal, Waves, Sun, Coins } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  videoUrl?: string;
  musicUrl?: string;
}

interface ThemeSwitcherProps {
  themes: Theme[];
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

const themeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  hacker: Terminal,
  ocean: Waves,
  sunset: Sun,
  gold: Coins,
};

export function ThemeSwitcher({ 
  themes, 
  currentTheme, 
  onThemeChange 
}: ThemeSwitcherProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/80 backdrop-blur-lg border border-white/10"
      >
        {themes.map((theme) => {
          const Icon = themeIcons[theme.id] || Home;
          const isActive = currentTheme === theme.id;
          
          return (
            <Tooltip key={theme.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onThemeChange(theme.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                    ${isActive 
                      ? 'bg-white/20 border-2 border-white/50' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  <Icon 
                    className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-white/60'}`} 
                  />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg"
              >
                {theme.name}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </motion.div>
    </TooltipProvider>
  );
}
