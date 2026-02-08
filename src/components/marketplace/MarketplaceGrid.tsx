import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketplaceItem } from '@/hooks/useMarketplace';
import { MarketplaceCard } from './MarketplaceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MarketplaceGridProps {
  items: MarketplaceItem[];
  isLoading: boolean;
  userBalance: bigint;
  isOwner?: boolean;
  isPurchased?: boolean;
  emptyMessage: string;
  emptyAction?: () => void;
  emptyActionLabel?: string;
  showCategories?: boolean;
  viewMode?: 'list' | 'grid';
}

export function MarketplaceGrid({
  items,
  isLoading,
  userBalance,
  isOwner,
  isPurchased,
  emptyMessage,
  emptyAction,
  emptyActionLabel,
  showCategories = false,
  viewMode = 'list',
}: MarketplaceGridProps) {
  if (isLoading) {
    return (
      <div className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-3'
      )}>
        {Array.from({ length: viewMode === 'grid' ? 8 : 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "rounded-xl",
              viewMode === 'grid' ? 'h-[280px]' : 'h-[88px]'
            )}
          />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-muted-foreground/60" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {emptyAction
            ? "Start your trading journey by listing your first item."
            : "Check back later for new listings from our community."
          }
        </p>
        {emptyAction && emptyActionLabel && (
          <Button onClick={emptyAction} size="lg" className="shadow-lg">
            {emptyActionLabel}
          </Button>
        )}
      </motion.div>
    );
  }

  // Grid View
  if (viewMode === 'grid') {
    return (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <MarketplaceCard
              key={item.id}
              item={item}
              userBalance={userBalance}
              isOwner={isOwner}
              isPurchased={isPurchased}
              viewMode="grid"
            />
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // List View (with categories if enabled)
  if (showCategories) {
    const badges = items.filter(item => item.item_type === 'badge');
    const templates = items.filter(item => item.item_type === 'template');

    return (
      <div className="space-y-8">
        {badges.length > 0 && (
          <CategorySection
            title="Badges"
            icon={<Sparkles className="w-5 h-5" />}
            items={badges}
            userBalance={userBalance}
            isOwner={isOwner}
            isPurchased={isPurchased}
          />
        )}
        {templates.length > 0 && (
          <CategorySection
            title="Templates"
            icon={<Package className="w-5 h-5" />}
            items={templates}
            userBalance={userBalance}
            isOwner={isOwner}
            isPurchased={isPurchased}
          />
        )}
      </div>
    );
  }

  // Simple List
  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { transition: { staggerChildren: 0.03 } }
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <MarketplaceCard
            key={item.id}
            item={item}
            userBalance={userBalance}
            isOwner={isOwner}
            isPurchased={isPurchased}
            viewMode="list"
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  items: MarketplaceItem[];
  userBalance: bigint;
  isOwner?: boolean;
  isPurchased?: boolean;
}

function CategorySection({
  title,
  icon,
  items,
  userBalance,
  isOwner,
  isPurchased
}: CategorySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} available
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <MarketplaceCard
            key={item.id}
            item={item}
            userBalance={userBalance}
            isOwner={isOwner}
            isPurchased={isPurchased}
            viewMode="list"
          />
        ))}
      </div>
    </motion.div>
  );
}
