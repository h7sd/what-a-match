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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useInventory, useSellItems, InventoryItem } from '@/hooks/useCases';
import { formatUC } from '@/lib/uc';
import { cn } from '@/lib/utils';

const rarityColors = {
  common: 'border-gray-500/50 bg-gray-500/10',
  rare: 'border-blue-500/50 bg-blue-500/10',
  epic: 'border-purple-500/50 bg-purple-500/10',
  legendary: 'border-amber-500/50 bg-amber-500/10',
  premium: 'border-pink-500/50 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-amber-500/10',
};

type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'premium';

export function InventoryView() {
  const { data: inventory, isLoading } = useInventory();
  const sellMutation = useSellItems();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [sellAll, setSellAll] = useState(false);

  const filteredInventory = inventory?.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      (item.item_type === 'badge' &&
        item.badge?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.item_type === 'coins' &&
        item.coin_amount?.toString().includes(searchQuery));

    const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;

    return matchesSearch && matchesRarity;
  });

  const selectedInventoryItems = Array.from(selectedItems)
    .map((id) => inventory?.find((item) => item.id === id))
    .filter(Boolean) as InventoryItem[];

  const totalSelectedValue = selectedInventoryItems.reduce(
    (sum, item) => sum + BigInt(item.estimated_value),
    0n
  );

  const totalInventoryValue =
    inventory?.reduce((sum, item) => sum + BigInt(item.estimated_value), 0n) || 0n;

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSellSelected = () => {
    setSellAll(false);
    setShowSellDialog(true);
  };

  const handleSellAll = () => {
    setSellAll(true);
    setShowSellDialog(true);
  };

  const confirmSell = () => {
    if (sellAll) {
      sellMutation.mutate({ sellAll: true });
    } else {
      sellMutation.mutate({ itemIds: Array.from(selectedItems) });
    }
    setShowSellDialog(false);
    setSelectedItems(new Set());
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
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
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <Package className="relative w-16 h-16 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Your inventory is empty</h3>
        <p className="text-muted-foreground mb-6">
          Open cases to win items and they'll appear here
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Inventory</h2>
          <p className="text-sm text-muted-foreground">
            {inventory.length} items • Total value: {formatUC(totalInventoryValue)} UC
          </p>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {selectedItems.size} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSellSelected}
              className="gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Sell Selected ({formatUC(totalSelectedValue)} UC)
            </Button>
          </motion.div>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Rarity Filter */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
          {(['all', 'common', 'rare', 'epic', 'legendary', 'premium'] as RarityFilter[]).map(
            (filter) => (
              <Button
                key={filter}
                variant="ghost"
                size="sm"
                onClick={() => setRarityFilter(filter)}
                className={cn(
                  'capitalize',
                  rarityFilter === filter && 'bg-background shadow-sm'
                )}
              >
                {filter}
              </Button>
            )
          )}
        </div>

        {/* Sell All */}
        <Button
          variant="destructive"
          onClick={handleSellAll}
          className="gap-2"
          disabled={!inventory || inventory.length === 0}
        >
          <Trash2 className="w-4 h-4" />
          Sell All
        </Button>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredInventory?.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleItemSelection(item.id)}
              className={cn(
                'group relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
                rarityColors[item.rarity as keyof typeof rarityColors],
                selectedItems.has(item.id)
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-95'
                  : 'hover:scale-105 hover:shadow-lg'
              )}
            >
              {/* Selection Indicator */}
              {selectedItems.has(item.id) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg z-10"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}

              {/* Rarity Badge */}
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 text-[10px] capitalize"
              >
                {item.rarity}
              </Badge>

              {/* Item Visual */}
              <div className="flex items-center justify-center h-24 mb-3">
                {item.item_type === 'badge' && item.badge?.icon_url ? (
                  <img
                    src={item.badge.icon_url}
                    alt={item.badge.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : item.item_type === 'coins' ? (
                  <Coins className="w-16 h-16 text-amber-500" />
                ) : (
                  <Sparkles className="w-16 h-16 text-primary" />
                )}
              </div>

              {/* Item Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm truncate">
                  {item.item_type === 'badge'
                    ? item.badge?.name || 'Badge'
                    : `${item.coin_amount} Coins`}
                </h4>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Value</span>
                  <span className="font-mono font-semibold">
                    {formatUC(item.estimated_value)} UC
                  </span>
                </div>

                {item.case && (
                  <p className="text-xs text-muted-foreground truncate">
                    From: {item.case.name}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredInventory && filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No items match your filters</p>
        </div>
      )}

      {/* Sell Confirmation Dialog */}
      <AlertDialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {sellAll ? 'Sell All Items?' : `Sell ${selectedItems.size} Items?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {sellAll ? (
                <div className="space-y-2">
                  <p>
                    You are about to sell all {inventory.length} items in your inventory for a
                    total of:
                  </p>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-6 h-6 text-amber-500" />
                      <span className="text-2xl font-bold text-amber-500">
                        {formatUC(totalInventoryValue)} UC
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>You are about to sell {selectedItems.size} selected items for:</p>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="w-6 h-6 text-amber-500" />
                      <span className="text-2xl font-bold text-amber-500">
                        {formatUC(totalSelectedValue)} UC
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSell}
              disabled={sellMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {sellMutation.isPending ? 'Selling...' : 'Confirm Sale'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
