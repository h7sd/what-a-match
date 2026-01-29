import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Loader2, 
  Save,
  Eye,
  Palette,
  Settings,
  Award,
  ExternalLink,
  RefreshCw,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getBadgeIcon } from '@/lib/badges';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  uid_number: number;
  bio: string | null;
  background_url: string | null;
  background_video_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  music_url: string | null;
  discord_user_id: string | null;
  show_username: boolean;
  show_display_name: boolean;
  show_badges: boolean;
  show_views: boolean;
  show_avatar: boolean;
  show_links: boolean;
  show_description: boolean;
  start_screen_enabled: boolean;
  start_screen_text: string | null;
  profile_opacity: number;
  profile_blur: number;
  glow_username: boolean;
  glow_socials: boolean;
  glow_badges: boolean;
  transparent_badges: boolean;
  card_border_enabled: boolean;
  card_border_color: string | null;
  card_border_width: number;
  layout_style: string | null;
  card_style: string | null;
  name_font: string | null;
  text_font: string | null;
  views_count: number;
  created_at: string;
}

interface UserBadgeWithGlobal {
  id: string;
  badge_id: string;
  is_enabled: boolean;
  is_locked: boolean;
  badge: {
    id: string;
    name: string;
    color: string | null;
    icon_url: string | null;
  };
}

interface AdminUserDashboardProps {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
}

export function AdminUserDashboard({ user, open, onClose }: AdminUserDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSaving, setIsSaving] = useState(false);
  const [userBadges, setUserBadges] = useState<UserBadgeWithGlobal[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  
  // Profile form state
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    background_url: '',
    background_video_url: '',
    background_color: '#0a0a0a',
    accent_color: '#8b5cf6',
    text_color: '#ffffff',
    music_url: '',
    discord_user_id: '',
    show_username: true,
    show_display_name: true,
    show_badges: true,
    show_views: true,
    show_avatar: true,
    show_links: true,
    show_description: true,
    start_screen_enabled: false,
    start_screen_text: 'Click anywhere to enter',
    profile_opacity: 100,
    profile_blur: 0,
    glow_username: false,
    glow_socials: false,
    glow_badges: false,
    transparent_badges: false,
    card_border_enabled: true,
    card_border_color: '',
    card_border_width: 1,
    layout_style: 'stacked',
    card_style: 'classic',
    name_font: 'Inter',
    text_font: 'Inter',
  });

  // Load user data when opened
  useEffect(() => {
    if (open && user) {
      setFormData({
        display_name: user.display_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        background_url: user.background_url || '',
        background_video_url: user.background_video_url || '',
        background_color: user.background_color || '#0a0a0a',
        accent_color: user.accent_color || '#8b5cf6',
        text_color: user.text_color || '#ffffff',
        music_url: user.music_url || '',
        discord_user_id: user.discord_user_id || '',
        show_username: user.show_username ?? true,
        show_display_name: user.show_display_name ?? true,
        show_badges: user.show_badges ?? true,
        show_views: user.show_views ?? true,
        show_avatar: user.show_avatar ?? true,
        show_links: user.show_links ?? true,
        show_description: user.show_description ?? true,
        start_screen_enabled: user.start_screen_enabled ?? false,
        start_screen_text: user.start_screen_text || 'Click anywhere to enter',
        profile_opacity: user.profile_opacity ?? 100,
        profile_blur: user.profile_blur ?? 0,
        glow_username: user.glow_username ?? false,
        glow_socials: user.glow_socials ?? false,
        glow_badges: user.glow_badges ?? false,
        transparent_badges: user.transparent_badges ?? false,
        card_border_enabled: user.card_border_enabled ?? true,
        card_border_color: user.card_border_color || '',
        card_border_width: user.card_border_width ?? 1,
        layout_style: user.layout_style || 'stacked',
        card_style: user.card_style || 'classic',
        name_font: user.name_font || 'Inter',
        text_font: user.text_font || 'Inter',
      });
      loadUserBadges();
    }
  }, [open, user]);

  const loadUserBadges = async () => {
    setIsLoadingBadges(true);
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          is_enabled,
          is_locked,
          badge:global_badges(id, name, color, icon_url)
        `)
        .eq('user_id', user.user_id);

      if (error) throw error;
      setUserBadges((data || []) as UserBadgeWithGlobal[]);
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingBadges(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profile saved successfully!' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBadge = async (badgeId: string, field: 'is_enabled' | 'is_locked', currentValue: boolean) => {
    try {
      const updateData: any = { [field]: !currentValue };
      
      // If locking, also disable
      if (field === 'is_locked' && !currentValue) {
        updateData.is_enabled = false;
      }

      const { error } = await supabase
        .from('user_badges')
        .update(updateData)
        .eq('id', badgeId);

      if (error) throw error;

      setUserBadges(prev => 
        prev.map(b => b.id === badgeId 
          ? { ...b, ...updateData }
          : b
        )
      );

      queryClient.invalidateQueries({ queryKey: ['userBadges'] });
      queryClient.invalidateQueries({ queryKey: ['profileBadges'] });
      toast({ title: 'Badge updated' });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <DialogTitle className="text-left">
                {user.display_name || user.username}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                @{user.username} • UID #{user.uid_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/${user.username}`} target="_blank">
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                View Profile
              </Button>
            </Link>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 h-[calc(90vh-80px)]">
          <div className="p-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="profile" className="gap-1">
                  <User className="w-3 h-3" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="appearance" className="gap-1">
                  <Palette className="w-3 h-3" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="badges" className="gap-1">
                  <Award className="w-3 h-3" />
                  Badges
                </TabsTrigger>
                <TabsTrigger value="visibility" className="gap-1">
                  <Eye className="w-3 h-3" />
                  Visibility
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => updateField('display_name', e.target.value)}
                        placeholder="Display name"
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        placeholder="Bio..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Discord User ID</Label>
                      <Input
                        value={formData.discord_user_id}
                        onChange={(e) => updateField('discord_user_id', e.target.value)}
                        placeholder="Discord User ID"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Avatar URL</Label>
                      <Input
                        value={formData.avatar_url}
                        onChange={(e) => updateField('avatar_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Background URL</Label>
                      <Input
                        value={formData.background_url}
                        onChange={(e) => updateField('background_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Background Video URL</Label>
                      <Input
                        value={formData.background_video_url}
                        onChange={(e) => updateField('background_video_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Music URL</Label>
                      <Input
                        value={formData.music_url}
                        onChange={(e) => updateField('music_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Colors</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.background_color}
                            onChange={(e) => updateField('background_color', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={formData.background_color}
                            onChange={(e) => updateField('background_color', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.accent_color}
                            onChange={(e) => updateField('accent_color', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={formData.accent_color}
                            onChange={(e) => updateField('accent_color', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.text_color}
                            onChange={(e) => updateField('text_color', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={formData.text_color}
                            onChange={(e) => updateField('text_color', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Border Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.card_border_color || formData.accent_color}
                            onChange={(e) => updateField('card_border_color', e.target.value)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={formData.card_border_color}
                            onChange={(e) => updateField('card_border_color', e.target.value)}
                            className="flex-1"
                            placeholder="Uses accent if empty"
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold pt-4">Layout</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Layout Style</Label>
                        <Select value={formData.layout_style} onValueChange={(v) => updateField('layout_style', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stacked">Stacked</SelectItem>
                            <SelectItem value="side-by-side">Side by Side</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Card Style</Label>
                        <Select value={formData.card_style} onValueChange={(v) => updateField('card_style', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="glass">Glass</SelectItem>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Effects</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Profile Opacity ({formData.profile_opacity}%)</Label>
                        <Slider
                          value={[formData.profile_opacity]}
                          onValueChange={([v]) => updateField('profile_opacity', v)}
                          min={0}
                          max={100}
                          step={5}
                        />
                      </div>
                      <div>
                        <Label>Profile Blur ({formData.profile_blur}px)</Label>
                        <Slider
                          value={[formData.profile_blur]}
                          onValueChange={([v]) => updateField('profile_blur', v)}
                          min={0}
                          max={20}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label>Border Width ({formData.card_border_width}px)</Label>
                        <Slider
                          value={[formData.card_border_width]}
                          onValueChange={([v]) => updateField('card_border_width', v)}
                          min={0}
                          max={5}
                          step={1}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold pt-4">Glow Effects</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Glow Username</Label>
                        <Switch
                          checked={formData.glow_username}
                          onCheckedChange={(v) => updateField('glow_username', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Glow Socials</Label>
                        <Switch
                          checked={formData.glow_socials}
                          onCheckedChange={(v) => updateField('glow_socials', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Glow Badges</Label>
                        <Switch
                          checked={formData.glow_badges}
                          onCheckedChange={(v) => updateField('glow_badges', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Transparent Badges</Label>
                        <Switch
                          checked={formData.transparent_badges}
                          onCheckedChange={(v) => updateField('transparent_badges', v)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Badges Tab */}
              <TabsContent value="badges" className="space-y-4">
                {isLoadingBadges ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : userBadges.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    This user has no badges assigned.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userBadges.map((ub) => {
                      const Icon = getBadgeIcon(ub.badge.name);
                      return (
                        <div
                          key={ub.id}
                          className={`p-4 rounded-lg border ${
                            ub.is_locked 
                              ? 'border-destructive/30 bg-destructive/5' 
                              : ub.is_enabled 
                                ? 'border-green-500/30 bg-green-500/5'
                                : 'border-border bg-secondary/10'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${ub.badge.color || '#8B5CF6'}20` }}
                            >
                              {ub.badge.icon_url ? (
                                <img src={ub.badge.icon_url} alt="" className="w-6 h-6" />
                              ) : (
                                <Icon className="w-5 h-5" style={{ color: ub.badge.color || '#8B5CF6' }} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{ub.badge.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {ub.is_locked ? 'Locked' : ub.is_enabled ? 'Active' : 'Hidden'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant={ub.is_enabled && !ub.is_locked ? "default" : "outline"}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => toggleBadge(ub.id, 'is_enabled', ub.is_enabled)}
                              disabled={ub.is_locked}
                            >
                              {ub.is_enabled ? <Check className="w-3 h-3 mr-1" /> : null}
                              {ub.is_enabled ? 'Enabled' : 'Enable'}
                            </Button>
                            <Button
                              variant={ub.is_locked ? "destructive" : "outline"}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => toggleBadge(ub.id, 'is_locked', ub.is_locked)}
                            >
                              {ub.is_locked ? 'Unlock' : 'Lock'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Visibility Tab */}
              <TabsContent value="visibility" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Profile Elements</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Show Username</Label>
                        <Switch
                          checked={formData.show_username}
                          onCheckedChange={(v) => updateField('show_username', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Display Name</Label>
                        <Switch
                          checked={formData.show_display_name}
                          onCheckedChange={(v) => updateField('show_display_name', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Avatar</Label>
                        <Switch
                          checked={formData.show_avatar}
                          onCheckedChange={(v) => updateField('show_avatar', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Description</Label>
                        <Switch
                          checked={formData.show_description}
                          onCheckedChange={(v) => updateField('show_description', v)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Additional Elements</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Show Badges</Label>
                        <Switch
                          checked={formData.show_badges}
                          onCheckedChange={(v) => updateField('show_badges', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Links</Label>
                        <Switch
                          checked={formData.show_links}
                          onCheckedChange={(v) => updateField('show_links', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Show Views</Label>
                        <Switch
                          checked={formData.show_views}
                          onCheckedChange={(v) => updateField('show_views', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Card Border</Label>
                        <Switch
                          checked={formData.card_border_enabled}
                          onCheckedChange={(v) => updateField('card_border_enabled', v)}
                        />
                      </div>
                    </div>

                    <h3 className="font-semibold pt-4">Start Screen</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Enable Start Screen</Label>
                        <Switch
                          checked={formData.start_screen_enabled}
                          onCheckedChange={(v) => updateField('start_screen_enabled', v)}
                        />
                      </div>
                      {formData.start_screen_enabled && (
                        <div>
                          <Label>Start Screen Text</Label>
                          <Input
                            value={formData.start_screen_text}
                            onChange={(e) => updateField('start_screen_text', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}