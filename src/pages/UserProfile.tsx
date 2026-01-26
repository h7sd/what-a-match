import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useProfileByUsername, useSocialLinks, useBadges, useRecordProfileView } from '@/hooks/useProfile';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { SocialLinks } from '@/components/profile/SocialLinks';
import { BackgroundEffects } from '@/components/profile/BackgroundEffects';
import { MusicPlayer } from '@/components/profile/MusicPlayer';
import { CustomCursor } from '@/components/profile/CustomCursor';
import { DiscordPresence } from '@/components/profile/DiscordPresence';
import { StartScreen } from '@/components/profile/StartScreen';
import { ThemeSwitcher, Theme } from '@/components/profile/ThemeSwitcher';
import { ControlsBar } from '@/components/profile/ControlsBar';
import { GlitchOverlay } from '@/components/profile/GlitchOverlay';

const defaultThemes: Theme[] = [
  { id: 'home', name: 'Home', primaryColor: '#8B5CF6', secondaryColor: '#EC4899' },
  { id: 'hacker', name: 'Hacker', primaryColor: '#22C55E', secondaryColor: '#2DD4BF' },
  { id: 'ocean', name: 'Ocean', primaryColor: '#0EA5E9', secondaryColor: '#6366F1' },
  { id: 'sunset', name: 'Sunset', primaryColor: '#F97316', secondaryColor: '#EF4444' },
  { id: 'gold', name: 'Gold', primaryColor: '#EAB308', secondaryColor: '#F59E0B' },
];

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, error } = useProfileByUsername(username || '');
  const { data: socialLinks = [] } = useSocialLinks(profile?.id || '');
  const { data: badges = [] } = useBadges(profile?.id || '');
  const recordView = useRecordProfileView();
  
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('home');
  const [volume, setVolume] = useState(0.3);
  const [transparency, setTransparency] = useState(0.7);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get current theme colors
  const theme = defaultThemes.find(t => t.id === currentTheme) || defaultThemes[0];
  const accentColor = theme.primaryColor;

  // Record profile view
  useEffect(() => {
    if (profile?.id) {
      recordView.mutate(profile.id);
    }
  }, [profile?.id]);

  // Handle start screen click
  const handleStart = () => {
    setShowStartScreen(false);
    setHasInteracted(true);
    
    // Start audio if available
    if (audioRef.current && profile?.music_url) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch(console.error);
    }
  };

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground mb-6">User not found</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back home
          </Link>
        </motion.div>
      </div>
    );
  }

  const showCursorTrail = profile.effects_config?.sparkles;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Start Screen */}
      {showStartScreen && (
        <StartScreen 
          onStart={handleStart} 
          message="Click anywhere to enter" 
        />
      )}

      {/* Hidden audio element */}
      {profile.music_url && (
        <audio ref={audioRef} src={profile.music_url} loop />
      )}

      {/* Custom cursor with trail */}
      {showCursorTrail && hasInteracted && (
        <CustomCursor color={accentColor} showTrail={true} />
      )}

      {/* Glitch overlay effect */}
      <GlitchOverlay active={currentTheme === 'hacker'} intensity="low" />

      <BackgroundEffects
        backgroundUrl={profile.background_url}
        backgroundVideoUrl={(profile as any).background_video_url}
        backgroundColor={profile.background_color}
        accentColor={accentColor}
      />

      <div 
        className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-12"
        style={{ opacity: transparency }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: showStartScreen ? 0 : 1, y: showStartScreen ? 30 : 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md mx-auto space-y-6"
        >
          <ProfileCard profile={{...profile, accent_color: accentColor}} badges={badges} />

          {/* Discord Presence Widget */}
          {(profile as any).discord_user_id && (
            <DiscordPresence
              username={(profile as any).discord_user_id}
              status="online"
              activityName="Visual Studio Code"
              activityType="Playing"
              activityDetails="Working on UserVault"
              accentColor={accentColor}
            />
          )}

          {socialLinks.length > 0 && (
            <SocialLinks 
              links={socialLinks} 
              accentColor={accentColor}
              glowingIcons={profile.effects_config?.glow}
            />
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showStartScreen ? 0 : 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <Link
            to="/"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Create your own bio page →
          </Link>
        </motion.div>
      </div>

      {/* Controls Bar */}
      {!showStartScreen && profile.music_url && (
        <ControlsBar
          volume={volume}
          onVolumeChange={setVolume}
          transparency={transparency}
          onTransparencyChange={setTransparency}
          accentColor={accentColor}
        />
      )}

      {/* Theme Switcher */}
      {!showStartScreen && (
        <ThemeSwitcher
          themes={defaultThemes}
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
        />
      )}
    </div>
  );
}
