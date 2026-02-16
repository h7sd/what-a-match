import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Award, Loader2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { BadgeIconUploader } from './BadgeIconUploader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  useGlobalBadges,
  useCreateGlobalBadge,
  useUpdateGlobalBadge,
  useDeleteGlobalBadge,
  GlobalBadge,
} from '@/hooks/useBadges';

export function AdminBadgeManager() {
  const { data: badges = [], isLoading } = useGlobalBadges();
  const createBadge = useCreateGlobalBadge();
  const updateBadge = useUpdateGlobalBadge();
  const deleteBadge = useDeleteGlobalBadge();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingBadge, setEditingBadge] = useState<GlobalBadge | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: '',
    color: '#8B5CF6',
    rarity: 'common',
    is_limited: false,
    max_claims: null as number | null,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_url: '',
      color: '#8B5CF6',
      rarity: 'common',
      is_limited: false,
      max_claims: null,
    });
    setEditingBadge(null);
  };

  const openEditDialog = (badge: GlobalBadge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || '',
      icon_url: badge.icon_url || '',
      color: badge.color || '#8B5CF6',
      rarity: badge.rarity || 'common',
      is_limited: badge.is_limited || false,
      max_claims: badge.max_claims,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBadge) {
        await updateBadge.mutateAsync({
          id: editingBadge.id,
          name: formData.name,
          description: formData.description || null,
          icon_url: formData.icon_url || null,
          color: formData.color,
          rarity: formData.rarity,
          is_limited: formData.is_limited,
          max_claims: formData.max_claims,
        });
        toast({ title: 'Badge updated!' });
      } else {
        await createBadge.mutateAsync({
          name: formData.name,
          description: formData.description || null,
          icon_url: formData.icon_url || null,
          color: formData.color,
          rarity: formData.rarity,
          is_limited: formData.is_limited,
          max_claims: formData.max_claims,
        });
        toast({ title: 'Badge created!' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMessage = `⚠️ WARNING: Delete this badge?\n\n` +
      `This will PERMANENTLY remove it from:\n` +
      `• The global badge system\n` +
      `• ALL users who have this badge\n\n` +
      `This action CANNOT be undone!`;

    if (!confirm(confirmMessage)) return;

    try {
      await deleteBadge.mutateAsync(id);
      toast({
        title: 'Badge deleted',
        description: 'Removed from all users'
      });
      setSelectedBadges(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBadges.size === 0) return;

    const confirmMessage = `⚠️ WARNING: Are you sure you want to delete ${selectedBadges.size} badge(s)?\n\n` +
      `This will PERMANENTLY remove these badges from:\n` +
      `• The global badge system\n` +
      `• ALL users who have these badges\n` +
      `• All badge assignments\n\n` +
      `This action CANNOT be undone!`;

    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = Array.from(selectedBadges).map(id =>
        deleteBadge.mutateAsync(id)
      );
      await Promise.all(deletePromises);
      toast({
        title: 'Badges deleted successfully',
        description: `${selectedBadges.size} badge(s) removed from all users`
      });
      setSelectedBadges(new Set());
    } catch (error: any) {
      toast({ title: error.message, variant: 'destructive' });
    }
  };

  const toggleBadgeSelection = (id: string) => {
    setSelectedBadges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedBadges.size === badges.length) {
      setSelectedBadges(new Set());
    } else {
      setSelectedBadges(new Set(badges.map(b => b.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">Badge Manager</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedBadges.size > 0
                    ? `${selectedBadges.size} selected of ${badges.length}`
                    : `${badges.length} ${badges.length === 1 ? 'badge' : 'badges'} total`
                  }
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
              )}
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {selectedBadges.size > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBadges(new Set())}
                  className="gap-2"
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={deleteBadge.isPending}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedBadges.size}
                </Button>
              </>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Badge
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBadge ? 'Edit Badge' : 'Create New Badge'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Badge name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Badge description"
                  />
                </div>

                <BadgeIconUploader
                  currentUrl={formData.icon_url}
                  onUpload={(url) => setFormData({ ...formData, icon_url: url })}
                  onRemove={() => setFormData({ ...formData, icon_url: '' })}
                  color={formData.color}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rarity</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(value) => setFormData({ ...formData, rarity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="uncommon">Uncommon</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="epic">Epic</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <Label>Limited Badge</Label>
                    <p className="text-xs text-muted-foreground">Restrict claims</p>
                  </div>
                  <Switch
                    checked={formData.is_limited}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_limited: checked })}
                  />
                </div>

                {formData.is_limited && (
                  <div className="space-y-2">
                    <Label>Max Claims</Label>
                    <Input
                      type="number"
                      value={formData.max_claims || ''}
                      onChange={(e) => setFormData({ ...formData, max_claims: parseInt(e.target.value) || null })}
                      placeholder="Unlimited"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={createBadge.isPending || updateBadge.isPending}>
                  {(createBadge.isPending || updateBadge.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingBadge ? 'Update Badge' : 'Create Badge'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <CollapsibleContent>
          {badges.length > 0 && (
            <div className="flex items-center justify-between py-3 px-2 border-b border-border/30">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSelectAll}
                className="gap-2 h-8"
              >
                {selectedBadges.size === badges.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Select All
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Click badges to select
              </span>
            </div>
          )}
          <div className="grid gap-3 pt-2">
            {badges.map((badge) => {
              const isSelected = selectedBadges.has(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative overflow-hidden rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleBadgeSelection(badge.id)}
                      className="flex-shrink-0"
                    />
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center relative flex-shrink-0 shadow-sm cursor-pointer"
                      style={{ backgroundColor: `${badge.color}20` }}
                      onClick={() => toggleBadgeSelection(badge.id)}
                    >
                      {badge.icon_url && badge.icon_url.trim() !== '' ? (
                        <img src={badge.icon_url} alt={badge.name} className="w-9 h-9 object-contain" />
                      ) : (
                        <Award className="w-7 h-7" style={{ color: badge.color || '#8B5CF6' }} />
                      )}
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleBadgeSelection(badge.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base truncate">
                          {badge.name}
                        </h4>
                        <span
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize flex-shrink-0"
                          style={{
                            backgroundColor: `${badge.color}20`,
                            color: badge.color || '#8B5CF6',
                          }}
                        >
                          {badge.rarity}
                        </span>
                        {badge.is_limited && (
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 flex-shrink-0">
                            Limited
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                        {badge.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Claims: <span className="font-medium text-muted-foreground">{badge.claims_count || 0}</span>
                        {badge.is_limited && badge.max_claims && ` / ${badge.max_claims}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(badge);
                        }}
                        className="h-9 w-9 hover:bg-primary/10 hover:border-primary/50"
                        title="Edit Badge"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(badge.id);
                        }}
                        disabled={deleteBadge.isPending}
                        className="h-9 w-9 hover:bg-destructive/10 hover:border-destructive/50"
                        title="Delete Badge"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50"
                    style={{ backgroundColor: badge.color || '#8B5CF6' }}
                  />
                </motion.div>
              );
            })}

            {badges.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first badge to get started
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
