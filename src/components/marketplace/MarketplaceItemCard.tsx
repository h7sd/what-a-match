import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, User, ShoppingCart, Check, Clock, X, Package, Sparkles } from 'lucide-react';
import { MarketplaceItem, usePurchaseItem } from '@/hooks/useMarketplace';
import { cn } from '@/lib/utils';
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

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  isOwner?: boolean;
  isPurchased?: boolean;
  userBalance: number;
}

export function MarketplaceItemCard({ item, isOwner, isPurchased, userBalance }: MarketplaceItemCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const purchaseMutation = usePurchaseItem();
  
  const name = item.item_type === 'badge' ? item.badge_name : item.template_name;
  const description = item.item_type === 'badge' ? item.badge_description : item.template_description;
  const iconUrl = item.item_type === 'badge' ? item.badge_icon_url : item.template_preview_url;
  const color = item.badge_color || '#8B5CF6';
  
  const canAfford = userBalance >= item.price;
  const isSoldOut = item.status === 'sold_out' || 
    (item.sale_type === 'single' && item.stock_sold > 0) ||
    (item.sale_type === 'limited' && item.stock_sold >= (item.stock_limit || 0));

  const statusBadge = () => {
    if (isPurchased) return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Owned</Badge>;
    if (item.status === 'pending') return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
    if (item.status === 'denied') return <Badge variant="destructive" className="gap-1"><X className="w-3 h-3" /> Denied</Badge>;
    if (isSoldOut) return <Badge variant="secondary">Sold Out</Badge>;
    return null;
  };

  const saleTypeBadge = () => {
    switch (item.sale_type) {
      case 'single':
        return <Badge variant="outline" className="text-xs">Unique</Badge>;
      case 'limited':
        return <Badge variant="outline" className="text-xs">{item.stock_sold}/{item.stock_limit} sold</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unlimited</Badge>;
    }
  };

  const handlePurchase = () => {
    purchaseMutation.mutate(item.id);
    setShowConfirm(false);
  };

  return (
    <>
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-lg group",
        item.status === 'denied' && "opacity-60",
        isSoldOut && !isPurchased && "opacity-75"
      )}>
        <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
          {item.item_type === 'badge' ? (
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
              style={{ 
                backgroundColor: `${color}20`,
                border: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}40`
              }}
            >
              {iconUrl ? (
                <img src={iconUrl} alt={name || ''} className="w-12 h-12 object-contain" />
              ) : (
                <Sparkles className="w-8 h-8" style={{ color }} />
              )}
            </div>
          ) : (
            <div className="w-full h-full">
              {iconUrl ? (
                <img src={iconUrl} alt={name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-1">
            {statusBadge()}
          </div>
          
          <div className="absolute top-2 left-2">
            <Badge variant={item.item_type === 'badge' ? 'default' : 'secondary'}>
              {item.item_type === 'badge' ? 'Badge' : 'Template'}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{name || 'Unnamed'}</h3>
              <p className="text-xs text-muted-foreground truncate">
                by {item.seller_username || 'Unknown'}
              </p>
            </div>
            {saleTypeBadge()}
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          
          {item.status === 'denied' && item.denial_reason && (
            <p className="text-xs text-destructive">Reason: {item.denial_reason}</p>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center gap-1.5 font-bold text-amber-500">
            <Coins className="w-4 h-4" />
            <span>{item.price.toLocaleString()} UV</span>
          </div>
          
          {!isOwner && !isPurchased && item.status === 'approved' && !isSoldOut && (
            <Button 
              size="sm" 
              disabled={!canAfford || purchaseMutation.isPending}
              onClick={() => setShowConfirm(true)}
              className="gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              {canAfford ? 'Buy' : 'Not enough UV'}
            </Button>
          )}
          
          {isPurchased && (
            <Button size="sm" variant="secondary" disabled className="gap-1.5">
              <Check className="w-4 h-4" />
              Owned
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You're about to purchase <strong>{name}</strong> for <strong>{item.price.toLocaleString()} UV</strong>.</p>
              <p className="text-sm">
                Your balance after purchase: <strong>{(userBalance - item.price).toLocaleString()} UV</strong>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchase} disabled={purchaseMutation.isPending}>
              {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
