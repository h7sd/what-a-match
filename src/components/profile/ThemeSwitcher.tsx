import { motion } from 'framer-motion';

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

const defaultThemes: Theme[] = [
  { id: 'home', name: 'Home', primaryColor: '#8B5CF6', secondaryColor: '#EC4899' },
  { id: 'hacker', name: 'Hacker', primaryColor: '#22C55E', secondaryColor: '#2DD4BF' },
  { id: 'rain', name: 'Rain', primaryColor: '#1E3A8A', secondaryColor: '#2563EB' },
  { id: 'anime', name: 'Anime', primaryColor: '#DC2626', secondaryColor: '#F87171' },
  { id: 'car', name: 'Car', primaryColor: '#EAB308', secondaryColor: '#FACC15' },
];

export function ThemeSwitcher({ 
  themes = defaultThemes, 
  currentTheme, 
  onThemeChange 
}: ThemeSwitcherProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-lg border border-white/10"
    >
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className={`
            w-8 h-8 rounded-full border-2 transition-all duration-300
            ${currentTheme === theme.id 
              ? 'border-white shadow-lg' 
              : 'border-white/30 hover:border-white/60'
            }
          `}
          style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            boxShadow: currentTheme === theme.id 
              ? `0 0 20px ${theme.primaryColor}40` 
              : 'none',
          }}
          title={theme.name}
        />
      ))}
    </motion.div>
  );
}
