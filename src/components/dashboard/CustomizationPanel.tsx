import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Upload, 
  Palette, 
  Type, 
  Sparkles, 
  MessageSquare, 
  Sliders,
  Eye,
  Zap,
  Crown
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileUploader } from './FileUploader';
import { ColorPicker } from './ColorPicker';
import { PremiumLock, PremiumBadge } from './PremiumLock';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SiSpotify } from 'react-icons/si';

const FONTS = [
  'Inter',
  'JetBrains Mono',
  'Satoshi',
  'Outfit',
  'Space Grotesk',
  'Sora',
  'Poppins',
  'Manrope',
  'Orbitron',
  'Press Start 2P',
  'VT323',
  'Fira Code',
  'IBM Plex Mono',
  'Source Code Pro',
  'Roboto Mono',
  'Ubuntu Mono',
  'Inconsolata',
  'Playfair Display',
  'Crimson Text',
  'Lora',
  'Merriweather',
  'DM Serif Display',
  'Abril Fatface',
  'Bebas Neue',
  'Oswald',
  'Montserrat',
  'Raleway',
  'Quicksand',
  'Comfortaa',
  'Righteous',
  'Audiowide',
  'Russo One',
  'Bungee',
  'Permanent Marker',
  'Pacifico',
  'Dancing Script',
  'Caveat',
  'Shadows Into Light',
];

interface SectionProps {
  icon: React.ElementType;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ icon: Icon, title, description, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-sm">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-2 border-t border-border/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CustomizationPanelProps {
  backgroundUrl: string;
  setBackgroundUrl: (url: string) => void;
  backgroundVideoUrl: string;
  setBackgroundVideoUrl: (url: string) => void;
  musicUrl: string;
  setMusicUrl: (url: string) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  customCursorUrl: string;
  setCustomCursorUrl: (url: string) => void;
  
  bio: string;
  setBio: (bio: string) => void;
  location: string;
  setLocation: (location: string) => void;
  discordUserId: string;
  setDiscordUserId: (id: string) => void;
  profileOpacity: number;
  setProfileOpacity: (opacity: number) => void;
  profileBlur: number;
  setProfileBlur: (blur: number) => void;
  
  accentColor: string;
  setAccentColor: (color: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  iconColor: string;
  setIconColor: (color: string) => void;
  
  effects: {
    sparkles: boolean;
    tilt: boolean;
    glow: boolean;
    typewriter: boolean;
    cursorTrail?: boolean;
  };
  setEffects: (effects: any) => void;
  
  monochromeIcons: boolean;
  setMonochromeIcons: (value: boolean) => void;
  animatedTitle: boolean;
  setAnimatedTitle: (value: boolean) => void;
  swapBioColors: boolean;
  setSwapBioColors: (value: boolean) => void;
  useDiscordAvatar: boolean;
  setUseDiscordAvatar: (value: boolean) => void;
  discordAvatarDecoration: boolean;
  setDiscordAvatarDecoration: (value: boolean) => void;
  enableProfileGradient: boolean;
  setEnableProfileGradient: (value: boolean) => void;
  glowUsername: boolean;
  setGlowUsername: (value: boolean) => void;
  glowSocials: boolean;
  setGlowSocials: (value: boolean) => void;
  glowBadges: boolean;
  setGlowBadges: (value: boolean) => void;
  transparentBadges?: boolean;
  setTransparentBadges?: (value: boolean) => void;
  iconOnlyLinks: boolean;
  setIconOnlyLinks: (value: boolean) => void;
  iconLinksOpacity: number;
  setIconLinksOpacity: (value: number) => void;
  
  // Discord card customization
  discordCardStyle?: string;
  setDiscordCardStyle?: (style: string) => void;
  discordCardOpacity?: number;
  setDiscordCardOpacity?: (opacity: number) => void;
  discordShowBadge?: boolean;
  setDiscordShowBadge?: (show: boolean) => void;
  discordBadgeColor?: string;
  setDiscordBadgeColor?: (color: string) => void;
  showSpotifyWidget?: boolean;
  setShowSpotifyWidget?: (show: boolean) => void;

  backgroundEffect?: string;
  setBackgroundEffect?: (effect: string) => void;
  audioVolume?: number;
  setAudioVolume?: (volume: number) => void;
  
  // Font settings
  nameFont?: string;
  setNameFont?: (font: string) => void;
  textFont?: string;
  setTextFont?: (font: string) => void;
  
  // Premium status
  isPremium?: boolean;
}

export function CustomizationPanel(props: CustomizationPanelProps) {
  const [discordDialogOpen, setDiscordDialogOpen] = useState(false);
  const [tempDiscordId, setTempDiscordId] = useState(props.discordUserId);

  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyDisplayName, setSpotifyDisplayName] = useState<string | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyStatusLoading, setSpotifyStatusLoading] = useState(true);

  useEffect(() => {
    const checkSpotifyStatus = async () => {
      setSpotifyStatusLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const res = await fetch(`${supabaseUrl}/functions/v1/spotify-auth?action=status`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSpotifyConnected(data.connected);
          setSpotifyDisplayName(data.displayName ?? null);
        }
      } catch {
        // silent
      } finally {
        setSpotifyStatusLoading(false);
      }
    };
    checkSpotifyStatus();
  }, []);

  const handleSpotifyConnect = async () => {
    setSpotifyLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/spotify-auth?action=authorize`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch {
      // silent
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleSpotifyDisconnect = async () => {
    setSpotifyLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      await fetch(`${supabaseUrl}/functions/v1/spotify-disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
      });
      setSpotifyConnected(false);
      setSpotifyDisplayName(null);
    } catch {
      // silent
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleDiscordConnect = () => {
    props.setDiscordUserId(tempDiscordId);
    setDiscordDialogOpen(false);
  };

  const handleBackgroundEffectChange = (value: string) => {
    if (props.setBackgroundEffect) {
      props.setBackgroundEffect(value);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (props.setAudioVolume) {
      props.setAudioVolume(value[0] / 100);
    }
  };

  return (
    <div className="space-y-3">
      {/* Assets Upload Section */}
      <CollapsibleSection
        icon={Upload}
        title="Media Assets"
        description="Background, audio & cursor"
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FileUploader
            type="background"
            currentUrl={props.backgroundUrl || props.backgroundVideoUrl}
            onUpload={(url) => {
              if (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm')) {
                props.setBackgroundVideoUrl(url);
                props.setBackgroundUrl('');
              } else {
                props.setBackgroundUrl(url);
                props.setBackgroundVideoUrl('');
              }
            }}
            onRemove={() => {
              props.setBackgroundUrl('');
              props.setBackgroundVideoUrl('');
            }}
          />
          <FileUploader
            type="audio"
            currentUrl={props.musicUrl}
            onUpload={props.setMusicUrl}
            onRemove={() => props.setMusicUrl('')}
          />
          <FileUploader
            type="cursor"
            currentUrl={props.customCursorUrl}
            onUpload={props.setCustomCursorUrl}
            onRemove={() => props.setCustomCursorUrl('')}
          />
        </div>
      </CollapsibleSection>

      {/* Typography Section - PREMIUM */}
      <CollapsibleSection
        icon={Type}
        title={<span className="flex items-center gap-2">Typography {!props.isPremium && <PremiumBadge />}</span>}
        description="Fonts & text settings"
      >
        <PremiumLock isPremium={props.isPremium ?? false} featureName="Erweiterte Fonts">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Name Font</Label>
              <Select 
                value={props.nameFont || 'Inter'} 
                onValueChange={(v) => props.setNameFont?.(v)}
              >
                <SelectTrigger className="bg-secondary/30 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Text Font</Label>
              <Select 
                value={props.textFont || 'Inter'} 
                onValueChange={(v) => props.setTextFont?.(v)}
              >
                <SelectTrigger className="bg-secondary/30 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PremiumLock>
      </CollapsibleSection>

      {/* Colors Section */}
      <CollapsibleSection
        icon={Palette}
        title="Colors"
        description="Accent, text & background colors"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <ColorPicker
            label="Accent Color"
            value={props.accentColor}
            onChange={props.setAccentColor}
          />
          <ColorPicker
            label="Text Color"
            value={props.textColor}
            onChange={props.setTextColor}
          />
          <ColorPicker
            label="Background Color"
            value={props.backgroundColor}
            onChange={props.setBackgroundColor}
          />
          <ColorPicker
            label="Icon Color"
            value={props.iconColor}
            onChange={props.setIconColor}
          />
        </div>
      </CollapsibleSection>

      {/* Background Effects Section - PREMIUM */}
      <CollapsibleSection
        icon={Sparkles}
        title={<span className="flex items-center gap-2">Background Effects {!props.isPremium && <PremiumBadge />}</span>}
        description="Animated particle effects"
      >
        <PremiumLock isPremium={props.isPremium ?? false} featureName="Background Effekte">
          <div className="space-y-4">
            <Select 
              value={props.backgroundEffect || 'particles'} 
              onValueChange={handleBackgroundEffectChange}
            >
              <SelectTrigger className="bg-secondary/30">
                <SelectValue placeholder="Choose an effect" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="particles">✨ Particles</SelectItem>
                <SelectItem value="matrix">💻 Matrix</SelectItem>
                <SelectItem value="stars">⭐ Stars</SelectItem>
                <SelectItem value="snow">❄️ Snow</SelectItem>
                <SelectItem value="fireflies">🔥 Fireflies</SelectItem>
                <SelectItem value="rain">🌧️ Rain</SelectItem>
                <SelectItem value="aurora">🌌 Aurora</SelectItem>
                <SelectItem value="bubbles">🫧 Bubbles</SelectItem>
                <SelectItem value="confetti">🎉 Confetti</SelectItem>
                <SelectItem value="geometric">🔷 Geometric</SelectItem>
                <SelectItem value="hearts">❤️ Hearts</SelectItem>
                <SelectItem value="leaves">🍂 Falling Leaves</SelectItem>
                <SelectItem value="smoke">💨 Smoke</SelectItem>
                <SelectItem value="lightning">⚡ Lightning</SelectItem>
                <SelectItem value="ripples">🌊 Ripples</SelectItem>
                <SelectItem value="hexagons">⬡ Hexagons</SelectItem>
                <SelectItem value="dna">🧬 DNA Helix</SelectItem>
                <SelectItem value="binary">01 Binary Rain</SelectItem>
                <SelectItem value="sakura">🌸 Sakura</SelectItem>
                <SelectItem value="music">🎵 Music Notes</SelectItem>
                <SelectItem value="plasma">🔮 Plasma</SelectItem>
                <SelectItem value="cyber">🤖 Cyber Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PremiumLock>
      </CollapsibleSection>

      {/* Discord Integration Section */}
      <CollapsibleSection
        icon={MessageSquare}
        title="Discord & Spotify"
        description="Show your live status"
      >
        <div className="space-y-4">
          <Dialog open={discordDialogOpen} onOpenChange={setDiscordDialogOpen}>
            <DialogTrigger asChild>
              <button 
                className="w-full p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 transition-colors cursor-pointer text-left"
                onClick={() => setTempDiscordId(props.discordUserId)}
              >
                {props.discordUserId ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium">Connected</p>
                      <p className="text-xs text-muted-foreground">ID: {props.discordUserId}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm">Connect Discord</p>
                      <p className="text-xs text-muted-foreground">
                        Show your status & Spotify activity
                      </p>
                    </div>
                  </div>
                )}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                  Discord & Spotify Integration
                </DialogTitle>
                <DialogDescription>
                  Connect your Discord to show your live status and Spotify activity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Spotify OAuth Connect */}
                <div className="p-3 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SiSpotify className="w-5 h-5 text-[#1DB954]" />
                      <span className="text-sm font-medium text-[#1DB954]">Spotify Integration</span>
                    </div>
                    {spotifyConnected && (
                      <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded-full font-medium">Connected</span>
                    )}
                  </div>

                  {spotifyStatusLoading ? (
                    <p className="text-xs text-muted-foreground">Checking connection...</p>
                  ) : spotifyConnected ? (
                    <div className="space-y-2">
                      {spotifyDisplayName && (
                        <p className="text-xs text-muted-foreground">
                          Connected as <span className="text-foreground font-medium">{spotifyDisplayName}</span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Your currently playing track will appear on your profile when you listen to Spotify.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={handleSpotifyDisconnect}
                        disabled={spotifyLoading}
                      >
                        {spotifyLoading ? 'Disconnecting...' : 'Disconnect Spotify'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Connect your Spotify account to show what you're listening to in real time. Your tokens are stored securely and never exposed publicly.
                      </p>
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs bg-[#1DB954] hover:bg-[#1aa34a] text-black font-semibold"
                        onClick={handleSpotifyConnect}
                        disabled={spotifyLoading}
                      >
                        <SiSpotify className="w-3.5 h-3.5 mr-1.5" />
                        {spotifyLoading ? 'Redirecting...' : 'Connect Spotify'}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Discord User ID</Label>
                  <Input
                    value={tempDiscordId}
                    onChange={(e) => setTempDiscordId(e.target.value)}
                    placeholder="123456789012345678"
                    className="bg-secondary/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enable Developer Mode in Discord, then right-click your profile and select "Copy User ID"
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Your Discord must be connected to{' '}
                    <a href="https://lanyard.rest" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Lanyard
                    </a>
                    {' '}for real-time presence.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleDiscordConnect} className="flex-1">
                    {props.discordUserId ? 'Update' : 'Connect'}
                  </Button>
                  {props.discordUserId && (
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        props.setDiscordUserId('');
                        setDiscordDialogOpen(false);
                      }}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
                
                {/* Discord Card Customization */}
                {props.discordUserId && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium">Card Appearance</h4>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Card Style</Label>
                      <Select 
                        value={props.discordCardStyle || 'glass'} 
                        onValueChange={(v) => props.setDiscordCardStyle?.(v)}
                      >
                        <SelectTrigger className="bg-secondary/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="glass">Glass (Frosted)</SelectItem>
                          <SelectItem value="solid">Solid Dark</SelectItem>
                          <SelectItem value="outlined">Outlined</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Card Opacity ({props.discordCardOpacity || 100}%)</Label>
                      <Slider
                        value={[props.discordCardOpacity || 100]}
                        onValueChange={([v]) => props.setDiscordCardOpacity?.(v)}
                        min={30}
                        max={100}
                        step={5}
                        className="py-2"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs">Show UV Badge</Label>
                        <p className="text-[10px] text-muted-foreground">Display badge next to username</p>
                      </div>
                      <Switch
                        checked={props.discordShowBadge ?? true}
                        onCheckedChange={(checked) => props.setDiscordShowBadge?.(checked)}
                      />
                    </div>
                    
                    {(props.discordShowBadge ?? true) && (
                      <div className="space-y-2">
                        <Label className="text-xs">Badge Color</Label>
                        <div className="flex gap-2">
                          {['#ec4899', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'].map((color) => (
                            <button
                              key={color}
                              onClick={() => props.setDiscordBadgeColor?.(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                props.discordBadgeColor === color ? 'border-white scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {props.discordUserId && (
            <div className="grid grid-cols-2 gap-2">
              <ToggleItem
                label="Use Discord Avatar"
                checked={props.useDiscordAvatar}
                onChange={props.setUseDiscordAvatar}
              />
              <ToggleItem
                label="Avatar Decoration"
                checked={props.discordAvatarDecoration}
                onChange={props.setDiscordAvatarDecoration}
              />
              <ToggleItem
                label="Spotify Widget"
                checked={props.showSpotifyWidget ?? true}
                onChange={(v) => props.setShowSpotifyWidget?.(v)}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Visual Effects Section - PREMIUM */}
      <CollapsibleSection
        icon={Zap}
        title={<span className="flex items-center gap-2">Visual Effects {!props.isPremium && <PremiumBadge />}</span>}
        description="Glows, animations & styles"
      >
        <PremiumLock isPremium={props.isPremium ?? false} featureName="Visual Effects">
          <div className="space-y-4">
            {/* Element Glow Settings */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Element Glows</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={props.glowSocials ? "default" : "outline"} 
                  size="sm"
                  onClick={() => props.setGlowSocials(!props.glowSocials)}
                  className="text-xs h-8"
                >
                  🌐 Social Links
                </Button>
                <Button 
                  variant={props.glowBadges ? "default" : "outline"} 
                  size="sm"
                  onClick={() => props.setGlowBadges(!props.glowBadges)}
                  className="text-xs h-8"
                >
                  🏆 Badges
                </Button>
              </div>
            </div>

            {/* Username Text Effects */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Username Text Effects</Label>
              <div className="grid grid-cols-2 gap-2">
                <ToggleItem
                  label="🌈 Rainbow Gradient"
                  checked={props.enableProfileGradient}
                  onChange={props.setEnableProfileGradient}
                />
                <ToggleItem
                  label="💫 Glow Pulse"
                  checked={props.glowUsername}
                  onChange={props.setGlowUsername}
                />
                <ToggleItem
                  label="⚡ Glitch Effect"
                  checked={props.effects.glow}
                  onChange={(checked) => props.setEffects({ ...props.effects, glow: checked })}
                />
                <ToggleItem
                  label="⌨️ Typewriter"
                  checked={props.effects.typewriter}
                  onChange={(checked) => props.setEffects({ ...props.effects, typewriter: checked })}
                />
                <ToggleItem
                  label="✨ Sparkles"
                  checked={props.effects.sparkles}
                  onChange={(checked) => props.setEffects({ ...props.effects, sparkles: checked })}
                />
                <ToggleItem
                  label="🎯 3D Tilt Card"
                  checked={props.effects.tilt}
                  onChange={(checked) => props.setEffects({ ...props.effects, tilt: checked })}
                />
                <ToggleItem
                  label="🖱️ Cursor Trail"
                  checked={props.effects.cursorTrail || false}
                  onChange={(checked) => props.setEffects({ ...props.effects, cursorTrail: checked })}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Note: Only one text effect applies at a time (priority: Rainbow → Glow → Typewriter → Glitch → Sparkles)
              </p>
            </div>

            {/* Badge Style */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Badge Style</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={props.transparentBadges ? "outline" : "default"} 
                  size="sm"
                  onClick={() => props.setTransparentBadges?.(false)}
                  className="text-xs h-8"
                >
                  🎨 With Background
                </Button>
                <Button 
                  variant={props.transparentBadges ? "default" : "outline"} 
                  size="sm"
                  onClick={() => props.setTransparentBadges?.(true)}
                  className="text-xs h-8"
                >
                  ✨ Transparent
                </Button>
              </div>
            </div>
          </div>
        </PremiumLock>
      </CollapsibleSection>

      {/* Advanced Settings Section */}
      <CollapsibleSection
        icon={Sliders}
        title="Advanced Settings"
        description="Opacity, blur & other options"
      >
        <div className="space-y-4">
          {/* Sliders */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Profile Opacity</Label>
                <span className="text-xs text-muted-foreground">{props.profileOpacity}%</span>
              </div>
              <Slider
                value={[props.profileOpacity]}
                onValueChange={([v]) => props.setProfileOpacity(v)}
                min={20}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Profile Blur</Label>
                <span className="text-xs text-muted-foreground">{props.profileBlur}px</span>
              </div>
              <Slider
                value={[props.profileBlur]}
                onValueChange={([v]) => props.setProfileBlur(v)}
                min={0}
                max={80}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Audio Volume</Label>
                <span className="text-xs text-muted-foreground">{Math.round((props.audioVolume ?? 0.5) * 100)}%</span>
              </div>
              <Slider
                value={[Math.round((props.audioVolume ?? 0.5) * 100)]}
                onValueChange={handleVolumeChange}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {props.iconOnlyLinks && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Icon Links Opacity</Label>
                  <span className="text-xs text-muted-foreground">{props.iconLinksOpacity}%</span>
                </div>
                <Slider
                  value={[props.iconLinksOpacity]}
                  onValueChange={(value) => props.setIconLinksOpacity(value[0])}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <Input
              value={props.location}
              onChange={(e) => props.setLocation(e.target.value)}
              placeholder="📍 Your location"
              className="bg-secondary/30 h-9"
            />
          </div>

          {/* Toggle Options */}
          <div className="grid grid-cols-2 gap-2">
            <ToggleItem
              label="Monochrome Icons"
              checked={props.monochromeIcons}
              onChange={props.setMonochromeIcons}
            />
            <ToggleItem
              label="Animated Title"
              checked={props.animatedTitle}
              onChange={props.setAnimatedTitle}
            />
            <ToggleItem
              label="Swap Bio Colors"
              checked={props.swapBioColors}
              onChange={props.setSwapBioColors}
            />
            <ToggleItem
              label="Icon-Only Links"
              checked={props.iconOnlyLinks}
              onChange={props.setIconOnlyLinks}
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// Compact toggle item component
function ToggleItem({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 border border-border/30">
      <Label className="text-xs cursor-pointer">{label}</Label>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="scale-90"
      />
    </div>
  );
}
