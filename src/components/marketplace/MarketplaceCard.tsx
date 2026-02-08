import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  ShoppingCart,
  Check,
  Clock,
  X,
  Sparkles,
  Package,
  Wand2,
  TrendingUp,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { MarketplaceItem, usePurchaseItem, useApplyTemplate } from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
import { formatUC } from '@/lib/uc';

interface MarketplaceCardProps {
  item: MarketplaceItem;
  userBalance: bigint;
  isOwner?: boolean;
  isPurchased?: boolean;
  viewMode?: 'list' | 'grid';
}

export function MarketplaceCard({
  item,
  userBalance,
  isOwner,
  isPurchased,
  viewMode = 'list'
}: MarketplaceCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const purchaseMutation = usePurchaseItem();
  const applyTemplateMutation = useApplyTemplate();

  const name = item.item_type === 'badge' ? item.badge_name : item.template_name;
  const description = item.item_type === 'badge' ? item.badge_description : item.template_description;
  const iconUrl = item.item_type === 'badge' ? item.badge_icon_url : item.template_preview_url;
  const color = item.badge_color || '#8B5CF6';

  const priceBI = BigInt(item.price);
  const canAfford = userBalance >= priceBI;
  const isSoldOut =
    item.status === 'sold_out' ||
    (item.sale_type === 'single' && item.stock_sold > 0) ||
    (item.sale_type === 'limited' && item.stock_sold >= (item.stock_limit || 0));

  const handlePurchase = () => {
    purchaseMutation.mutate(item.id);
    setShowConfirm(false);
  };

  const handleApplyTemplate = () => {
    applyTemplateMutation.mutate(item.id);
    setShowApplyConfirm(false);
  };

  const hasTemplateData = item.item_type === 'template' && item.template_data;

  const stockLeft = item.sale_type === 'single'
    ? (item.stock_sold > 0 ? 0 : 1)
    : item.sale_type === 'limited'
      ? Math.max(0, (item.stock_limit || 0) - item.stock_sold)
      : null;

  const itemVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Grid View Card
  if (viewMode === 'grid') {
    return (
      <>
        <motion.div
          variants={itemVariant}
          whileHover={{ y: -4 }}
          className={cn(
            "group relative rounded-2xl border overflow-hidden transition-all duration-300",
            "bg-card/60 backdrop-blur-sm border-border/40",
            "hover:border-primary/40 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/10",
            item.status === 'denied' && "opacity-50",
            isSoldOut && !isPurchased && "opacity-60"
          )}
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Preview/Icon Section */}
          <div className="relative h-40 flex items-center justify-center p-6 border-b border-border/30 bg-gradient-to-br from-muted/30 to-muted/10">
            {item.item_type === 'badge' ? (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg"
                style={{
                  backgroundColor: `${color}15`,
                  border: `2px solid ${color}30`,
                  boxShadow: `0 8px 24px ${color}20, 0 0 0 1px ${color}10`,
                }}
              >
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={name || 'Badge'}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <Sparkles className="w-12 h-12" style={{ color }} />
                )}
              </div>
            ) : (
              <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={name || 'Template'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            )}

            {/* Status Badge - Top Right */}
            {(isPurchased || item.status === 'pending' || item.status === 'denied' || isSoldOut) && (
              <div className="absolute top-3 right-3">
                {isPurchased && (
                  <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg backdrop-blur-sm gap-1">
                    <Check className="w-3 h-3" />
                    Owned
                  </Badge>
                )}
                {item.status === 'pending' && !isPurchased && (
                  <Badge className="bg-amber-500/90 text-white border-0 shadow-lg backdrop-blur-sm gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                )}
                {item.status === 'denied' && (
                  <Badge variant="destructive" className="shadow-lg backdrop-blur-sm gap-1">
                    <X className="w-3 h-3" />
                    Denied
                  </Badge>
                )}
                {isSoldOut && !isPurchased && (
                  <Badge className="bg-muted text-muted-foreground border-0 shadow-lg backdrop-blur-sm">
                    Sold Out
                  </Badge>
                )}
              </div>
            )}

            {/* Item Type Badge - Top Left */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-background/80 backdrop-blur-sm border-border/50 gap-1.5">
                {item.item_type === 'badge' ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Badge
                  </>
                ) : (
                  <>
                    <Package className="w-3 h-3" />
                    Template
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="relative p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-base text-foreground line-clamp-1 mb-1">
                {name || 'Unnamed'}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                {description || 'No description provided'}
              </p>
            </div>

            {/* Seller Info & Stock */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="truncate">@{item.seller_username || 'unknown'}</span>
              </div>
              {stockLeft !== null && (
                <div className="flex items-center gap-1 text-muted-foreground/60">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-mono font-medium">{stockLeft} left</span>
                </div>
              )}
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-bold text-amber-500">
                  {formatUC(item.price)}
                </span>
                <span className="text-xs text-amber-500/70">UC</span>
              </div>

              {!isOwner && !isPurchased && item.status === 'approved' && !isSoldOut && (
                <Button
                  size="sm"
                  variant={canAfford ? "default" : "secondary"}
                  disabled={!canAfford || purchaseMutation.isPending}
                  onClick={() => setShowConfirm(true)}
                  className="gap-1.5 shadow-md hover:shadow-lg"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Buy</span>
                </Button>
              )}

              {isPurchased && hasTemplateData && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => setShowApplyConfirm(true)}
                  disabled={applyTemplateMutation.isPending}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {renderDialogs()}
      </>
    );
  }

  // List View Card
  return (
    <>
      <motion.div
        variants={itemVariant}
        whileHover={{ x: 2 }}
        className={cn(
          "group relative rounded-xl border overflow-hidden transition-all duration-200",
          "bg-card/60 backdrop-blur-sm border-border/40",
          "hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5",
          item.status === 'denied' && "opacity-50",
          isSoldOut && !isPurchased && "opacity-60"
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Icon/Preview */}
          <div className={cn(
            "relative shrink-0 rounded-xl overflow-hidden",
            item.item_type === 'badge' ? "w-14 h-14" : "w-16 h-16",
            "shadow-md"
          )}>
            {item.item_type === 'badge' ? (
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: `${color}15`,
                  border: `2px solid ${color}25`,
                  boxShadow: `inset 0 0 20px ${color}15`,
                }}
              >
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={name || 'Badge'}
                    className="w-9 h-9 object-contain"
                  />
                ) : (
                  <Sparkles className="w-6 h-6" style={{ color }} />
                )}
              </div>
            ) : (
              iconUrl ? (
                <img
                  src={iconUrl}
                  alt={name || 'Template'}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Package className="w-7 h-7 text-muted-foreground/40" />
                </div>
              )
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {name || 'Unnamed'}
              </h3>

              {/* Inline Status Badges */}
              {isPurchased && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] px-1.5 py-0 gap-1">
                  <Check className="w-2.5 h-2.5" />
                  Owned
                </Badge>
              )}
              {item.status === 'pending' && !isPurchased && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Pending
                </Badge>
              )}
              {item.status === 'denied' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                  <X className="w-2.5 h-2.5" />
                  Denied
                </Badge>
              )}
              {isSoldOut && !isPurchased && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Sold Out
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">@{item.seller_username || 'unknown'}</span>
              {stockLeft !== null && (
                <>
                  <span>·</span>
                  <span className="font-mono">{stockLeft} left</span>
                </>
              )}
              <span>·</span>
              <span className="capitalize">{item.item_type}</span>
            </div>
          </div>

          {/* Price & Action */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-500">
                {formatUC(item.price)}
              </span>
            </div>

            {!isOwner && !isPurchased && item.status === 'approved' && !isSoldOut && (
              <Button
                size="sm"
                variant={canAfford ? "default" : "secondary"}
                disabled={!canAfford || purchaseMutation.isPending}
                onClick={() => setShowConfirm(true)}
                className="h-9 w-9 p-0"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}

            {isPurchased && hasTemplateData && (
              <Button
                size="sm"
                variant="secondary"
                className="h-9 w-9 p-0"
                onClick={() => setShowApplyConfirm(true)}
                disabled={applyTemplateMutation.isPending}
              >
                <Wand2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {renderDialogs()}
    </>
  );

  function renderDialogs() {
    return (
      <>
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className={cn(
                      "shrink-0 rounded-lg flex items-center justify-center",
                      item.item_type === 'badge' ? 'w-14 h-14' : 'w-16 h-16'
                    )}>
                      {item.item_type === 'badge' ? (
                        <div
                          className="w-full h-full rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${color}15`,
                            border: `2px solid ${color}30`
                          }}
                        >
                          {iconUrl ? (
                            <img src={iconUrl} alt="" className="w-9 h-9 object-contain" />
                          ) : (
                            <Sparkles className="w-7 h-7" style={{ color }} />
                          )}
                        </div>
                      ) : (
                        iconUrl ? (
                          <img src={iconUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="w-8 h-8 text-muted-foreground" />
                        )
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{item.seller_username}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold text-amber-500">{formatUC(item.price)} UC</span>
                    </div>
                    <div className="flex justify-between text-sm pb-2 border-b border-border">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className="font-semibold">{formatUC(userBalance)} UC</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Balance After</span>
                      <span className={canAfford ? 'text-foreground' : 'text-destructive'}>
                        {formatUC(userBalance - priceBI)} UC
                      </span>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showApplyConfirm} onOpenChange={setShowApplyConfirm}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Apply Template</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p>Apply <strong>{name}</strong> to your profile?</p>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-500">
                    ⚠️ This will overwrite your current profile style settings.
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleApplyTemplate}
                disabled={applyTemplateMutation.isPending}
              >
                {applyTemplateMutation.isPending ? 'Applying...' : 'Apply Template'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
}
