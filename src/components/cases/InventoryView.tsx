import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Coins,
  Trash2,
  DollarSign,
  Filter,
  Search,
  CheckCircle2,
  Sparkles,
  Key,
  ShieldCheck,
  Plus,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInventory, useSellItems, InventoryItem } from '@/hooks/useCases';
import { useUserBadges } from '@/hooks/useBadges';
import { BadgeIcon } from './BadgeIcon';
import { formatUC } from '@/lib/uc';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';

const rarityColors: Record<string, string> = {
  common: 'border-gray-500/50 bg-gray-500/10',
  rare: 'border-blue-500/50 bg-blue-500/10',
  epic: 'border-[#a855f7]/50 bg-[#a855f7]/10',
  legendary: 'border-amber-500/50 bg-amber-500/10',
  premium: 'border-pink-500/50 bg-gradient-to-br from-pink-500/10 via-[#a855f7]/10 to-amber-500/10',
};

const rarityTextColors: Record<string, string> = {
  common: '#b0c3d9',
  rare: '#5e98d9',
  epic: '#a855f7',
  legendary: '#eb4b4b',
  premium: '#ffd700',
};

type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'premium';

function groupInventoryByBadge(inventory: InventoryItem[]) {
  const groups: Map<string, InventoryItem[]> = new Map();
  const nonBadge: InventoryItem[] = [];

  for (const item of inventory) {
    if (item.item_type === 'badge' && (item.global_badge_id || item.badge_id)) {
      const key = item.global_badge_id || item.badge_id || item.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    } else {
      nonBadge.push(item);
    }
  }

  const grouped: Array<{ representative: InventoryItem; count: number; allIds: string[] }> = [];
  for (const [, items] of groups) {
    grouped.push({ representative: items[0], count: items.length, allIds: items.map(i => i.id) });
  }

  return { grouped, nonBadge };
}

interface AddToBadgesDialogProps {
  item: InventoryItem;
  count: number;
  open: boolean;
  onClose: () => void;
  alreadyOwned: boolean;
}

function AddToBadgesDialog({ item, count, open, onClose, alreadyOwned }: AddToBadgesDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const badgeId = item.global_badge_id || item.badge_id;
    if (!badgeId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)
        .maybeSingle();

      if (existing) {
        toast.info('You already have this badge on your profile!');
        onClose();
        return;
      }

      const { error } = await supabase.from('user_badges').insert({
        user_id: user.id,
        badge_id: badgeId,
        is_enabled: true,
        display_order: 0,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('You already have this badge on your profile!');
          onClose();
          return;
        }
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['profile-badges'] });
      toast.success(`"${item.badge?.name}" added to your badges!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add badge');
    } finally {
      setLoading(false);
    }
  };

  const rarity = item.rarity || 'common';
  const accentColor = rarityTextColors[rarity] || '#fff';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-[#0a0a0f] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Add to Profile Badges</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}40` }}
          >
            {item.badge?.icon_url ? (
              <BadgeIcon iconUrl={item.badge.icon_url} name={item.badge?.name} className="w-12 h-12 object-contain" />
            ) : (
              <ShieldCheck className="w-10 h-10" style={{ color: accentColor }} />
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-white">{item.badge?.name || 'Badge'}</p>
            <p className="text-sm capitalize" style={{ color: accentColor }}>{rarity}</p>
            {count > 1 && (
              <p className="text-xs text-gray-400 mt-1">You have {count}x of this badge</p>
            )}
          </div>

          {alreadyOwned ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <Check className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Already on your profile</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center">
              This badge will be added to your profile and can be enabled/disabled in your dashboard.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={loading || alreadyOwned}
            className="flex-1"
            style={!alreadyOwned ? {
              background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
              color: '#000',
              border: 'none',
            } : {}}
          >
            {loading ? 'Adding...' : alreadyOwned ? 'Already Added' : 'Add to Badges'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InventoryCardProps {
  item: InventoryItem;
  count: number;
  allIds: string[];
  selected: boolean;
  onToggleSelect: (ids: string[]) => void;
  ownedBadgeIds: Set<string>;
}

function InventoryCard({ item, count, allIds, selected, onToggleSelect, ownedBadgeIds }: InventoryCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const rarity = item.rarity || 'common';
  const accentColor = rarityTextColors[rarity] || '#fff';
  const isBadge = item.item_type === 'badge';
  const badgeId = item.global_badge_id || item.badge_id;
  const alreadyOwned = isBadge && badgeId ? ownedBadgeIds.has(badgeId) : false;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={() => onToggleSelect(allIds)}
        className={cn(
          'group relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
          rarityColors[rarity] || rarityColors.common,
          selected
            ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-black scale-95'
            : 'hover:scale-105 hover:shadow-lg'
        )}
      >
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg z-10"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
          </motion.div>
        )}

        {count > 1 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white border border-white/20">
            x{count}
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
          >
            {rarity}
          </span>
        </div>

        <div className="flex items-center justify-center h-24 mb-3 mt-4">
          {item.item_type === 'badge' && item.badge?.icon_url ? (
            <BadgeIcon iconUrl={item.badge.icon_url} name={item.badge.name} className="w-16 h-16 object-contain" />
          ) : item.item_type === 'coins' ? (
            <Coins className="w-14 h-14 text-amber-500" />
          ) : item.item_type === 'premium_key' ? (
            <Key className="w-14 h-14 text-yellow-400" />
          ) : (
            <Sparkles className="w-14 h-14 text-white/40" />
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm truncate text-white">
            {item.item_type === 'badge'
              ? item.badge?.name || 'Badge'
              : item.item_type === 'premium_key'
              ? 'Premium Key'
              : `${item.coin_amount} Coins`}
          </h4>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Value</span>
            <span className="font-mono font-semibold text-gray-300">
              {formatUC(item.estimated_value)} UC
            </span>
          </div>

          {isBadge && (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowAddDialog(true); }}
              className="w-full h-7 text-xs mt-1 gap-1"
              style={!alreadyOwned ? {
                background: `${accentColor}25`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              } : {
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              {alreadyOwned ? (
                <><Check className="w-3 h-3" /> On Profile</>
              ) : (
                <><Plus className="w-3 h-3" /> Add to Badges</>
              )}
            </Button>
          )}
        </div>
      </motion.div>

      {isBadge && (
        <AddToBadgesDialog
          item={item}
          count={count}
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          alreadyOwned={alreadyOwned}
        />
      )}
    </>
  );
}

export function InventoryView() {
  const { user } = useAuth();
  const { data: inventory, isLoading } = useInventory();
  const { data: userBadges } = useUserBadges(user?.id || '');
  const sellMutation = useSellItems();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [sellAll, setSellAll] = useState(false);

  const ownedBadgeIds = new Set<string>(
    (userBadges || []).flatMap((ub: any) => [ub.badge_id].filter(Boolean))
  );

  const filteredInventory = inventory?.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      (item.item_type === 'badge' && item.badge?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.item_type === 'coins' && item.coin_amount?.toString().includes(searchQuery));
    const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const { grouped, nonBadge } = groupInventoryByBadge(filteredInventory || []);

  const allSelectedItems = Array.from(selectedIds)
    .map((id) => inventory?.find((item) => item.id === id))
    .filter(Boolean) as InventoryItem[];

  const totalSelectedValue = allSelectedItems.reduce(
    (sum, item) => sum + BigInt(item.estimated_value), 0n
  );

  const totalInventoryValue =
    inventory?.reduce((sum, item) => sum + BigInt(item.estimated_value), 0n) || 0n;

  const toggleItemSelection = (ids: string[]) => {
    const newSelected = new Set(selectedIds);
    const allSelected = ids.every(id => newSelected.has(id));
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const confirmSell = () => {
    if (sellAll) {
      sellMutation.mutate({ sellAll: true });
    } else {
      sellMutation.mutate({ itemIds: Array.from(selectedIds) });
    }
    setShowSellDialog(false);
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!inventory || inventory.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <Package className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Your inventory is empty</h3>
        <p className="text-gray-500">Open cases to win items and they'll appear here</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Your Inventory</h2>
          <p className="text-sm text-gray-500">
            {inventory.length} items &bull; Total value: {formatUC(totalInventoryValue)} UC
          </p>
        </div>

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              {selectedIds.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSellAll(false); setShowSellDialog(true); }}
              className="gap-2 border-white/10 text-white hover:bg-white/10"
            >
              <DollarSign className="w-4 h-4" />
              Sell Selected ({formatUC(totalSelectedValue)} UC)
            </Button>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {(['all', 'common', 'rare', 'epic', 'legendary', 'premium'] as RarityFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setRarityFilter(filter)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium capitalize transition-all',
                rarityFilter === filter
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={() => { setSellAll(true); setShowSellDialog(true); }}
          className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
          disabled={!inventory || inventory.length === 0}
        >
          <Trash2 className="w-4 h-4" />
          Sell All
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {grouped.map(({ representative, count, allIds }) => (
            <InventoryCard
              key={allIds[0]}
              item={representative}
              count={count}
              allIds={allIds}
              selected={allIds.some(id => selectedIds.has(id))}
              onToggleSelect={toggleItemSelection}
              ownedBadgeIds={ownedBadgeIds}
            />
          ))}
          {nonBadge.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              count={1}
              allIds={[item.id]}
              selected={selectedIds.has(item.id)}
              onToggleSelect={toggleItemSelection}
              ownedBadgeIds={ownedBadgeIds}
            />
          ))}
        </AnimatePresence>
      </div>

      {grouped.length === 0 && nonBadge.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No items match your filters</p>
        </div>
      )}

      <AlertDialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <AlertDialogContent className="bg-[#0a0a0f] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {sellAll ? 'Sell All Items?' : `Sell ${selectedIds.size} Items?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {sellAll ? (
                <div className="space-y-2">
                  <p>You are about to sell all {inventory.length} items for:</p>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-400">{formatUC(totalInventoryValue)} UC</span>
                  </div>
                  <p className="text-xs">This action cannot be undone.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>You are about to sell {selectedIds.size} selected items for:</p>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-400">{formatUC(totalSelectedValue)} UC</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSell}
              disabled={sellMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {sellMutation.isPending ? 'Selling...' : 'Confirm Sale'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
