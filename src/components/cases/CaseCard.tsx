import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Coins, Info, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Case, useCaseItems } from '@/hooks/useCases';
import { formatUC } from '@/lib/uc';
import { cn } from '@/lib/utils';

interface CaseCardProps {
  case: Case;
  onOpen: (caseId: string) => void;
  userBalance: bigint;
  index: number;
}

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
  premium: 'bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500',
};

export function CaseCard({ case: caseItem, onOpen, userBalance, index }: CaseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: items } = useCaseItems(showDetails ? caseItem.id : null);
  const canAfford = userBalance >= BigInt(caseItem.price);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="group relative"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-primary to-amber-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition-all duration-500" />

        <div className="relative h-full rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:border-primary/40 group-hover:bg-card/80 group-hover:shadow-2xl">
          {/* Image Section */}
          <div className="relative h-48 bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden">
            {caseItem.image_url ? (
              <img
                src={caseItem.image_url}
                alt={caseItem.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-muted-foreground/40" />
              </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

            {/* Sparkle Effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-1">
                {caseItem.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                {caseItem.description || 'Open this case to win exclusive items and coins!'}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 border border-border/50">
              <span className="text-sm text-muted-foreground">Price</span>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-bold text-amber-500">
                  {formatUC(caseItem.price)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onOpen(caseItem.id)}
                disabled={!canAfford}
                className="flex-1 gap-2 shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Package className="w-4 h-4" />
                {canAfford ? 'Open Case' : 'Insufficient Coins'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowDetails(true)}
                className="gap-2"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{caseItem.name}</DialogTitle>
            <DialogDescription>
              {caseItem.description || 'View all possible items and their drop rates'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Price Info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <span className="font-medium">Case Price</span>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-xl font-bold text-amber-500">
                  {formatUC(caseItem.price)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Possible Items ({items?.length || 0})
              </h4>

              <div className="space-y-2">
                {items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rarity Indicator */}
                      <div
                        className={cn(
                          'w-1 h-12 rounded-full',
                          rarityColors[item.rarity as keyof typeof rarityColors]
                        )}
                      />

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.item_type === 'badge' && item.badge?.icon_url && (
                            <img
                              src={item.badge.icon_url}
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          {item.item_type === 'coins' && (
                            <Coins className="w-5 h-5 text-amber-500" />
                          )}
                          <span className="font-medium truncate">
                            {item.item_type === 'badge'
                              ? item.badge?.name || 'Badge'
                              : `${item.coin_amount} Coins`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {item.rarity}
                          </Badge>
                          <span>≈ {formatUC(item.display_value)} UC</span>
                        </div>
                      </div>
                    </div>

                    {/* Drop Rate */}
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {parseFloat(item.drop_rate.toString()).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">chance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Button */}
            <Button
              onClick={() => {
                setShowDetails(false);
                onOpen(caseItem.id);
              }}
              disabled={!canAfford}
              className="w-full gap-2"
              size="lg"
            >
              <Package className="w-4 h-4" />
              {canAfford ? 'Open Case Now' : 'Insufficient Coins'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
