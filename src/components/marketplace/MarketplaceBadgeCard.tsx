 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { Coins, ShoppingCart, Check, Clock, X, Sparkles } from 'lucide-react';
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
 import { MarketplaceItem, usePurchaseItem } from '@/hooks/useMarketplace';
 import { cn } from '@/lib/utils';
 import { formatUC } from '@/lib/uc';
 
 interface MarketplaceBadgeCardProps {
   item: MarketplaceItem;
   userBalance: bigint;
   isOwner?: boolean;
   isPurchased?: boolean;
 }
 
 export function MarketplaceBadgeCard({ 
   item, 
   userBalance, 
   isOwner, 
   isPurchased 
 }: MarketplaceBadgeCardProps) {
   const [showConfirm, setShowConfirm] = useState(false);
   const purchaseMutation = usePurchaseItem();
 
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
 
   const stockLeft = item.sale_type === 'single' 
     ? (item.stock_sold > 0 ? 0 : 1)
     : item.sale_type === 'limited' 
       ? Math.max(0, (item.stock_limit || 0) - item.stock_sold)
       : null;
 
   return (
     <>
       <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         whileHover={{ scale: 1.02 }}
         transition={{ duration: 0.2 }}
         className={cn(
           "group relative p-3 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm",
           "hover:border-primary/30 hover:bg-card/80 transition-all duration-200",
           item.status === 'denied' && "opacity-50",
           isSoldOut && !isPurchased && "opacity-60"
         )}
       >
         <div className="flex items-center gap-3">
           {/* Badge Icon */}
           <div
             className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
             style={{
               backgroundColor: `${color}15`,
               border: `1.5px solid ${color}40`,
               boxShadow: `0 0 16px ${color}20`,
             }}
           >
             {item.badge_icon_url ? (
               <img
                 src={item.badge_icon_url}
                 alt={item.badge_name || 'Badge'}
                 className="w-7 h-7 object-contain"
               />
             ) : (
               <Sparkles className="w-5 h-5" style={{ color }} />
             )}
           </div>
 
           {/* Content */}
           <div className="flex-1 min-w-0">
             <div className="flex items-center gap-1.5">
               <h3 className="font-medium text-sm text-foreground truncate">
                 {item.badge_name || 'Unnamed Badge'}
               </h3>
               {isPurchased && (
                 <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] px-1 py-0 h-4">
                   <Check className="w-2.5 h-2.5" />
                 </Badge>
               )}
               {item.status === 'pending' && (
                 <Clock className="w-3 h-3 text-muted-foreground" />
               )}
               {item.status === 'denied' && (
                 <X className="w-3 h-3 text-destructive" />
               )}
             </div>
             <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[11px] text-muted-foreground truncate">
                 @{item.seller_username || 'unknown'}
               </span>
               {stockLeft !== null && (
                 <>
                   <span className="text-muted-foreground/30">·</span>
                   <span className="text-[10px] text-muted-foreground/60 font-mono">
                     {stockLeft} left
                   </span>
                 </>
               )}
             </div>
           </div>
 
           {/* Price & Action */}
           <div className="shrink-0 flex items-center gap-2">
             <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
               <Coins className="w-3 h-3" />
               <span>{formatUC(item.price)}</span>
             </div>
 
             {!isOwner && !isPurchased && item.status === 'approved' && !isSoldOut && (
               <Button
                 size="sm"
                 variant={canAfford ? "default" : "secondary"}
                 disabled={!canAfford || purchaseMutation.isPending}
                 onClick={() => setShowConfirm(true)}
                 className="h-7 w-7 p-0"
               >
                 <ShoppingCart className="w-3.5 h-3.5" />
               </Button>
             )}
           </div>
         </div>
       </motion.div>
 
       <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
         <AlertDialogContent className="max-w-sm">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-base">Buy Badge</AlertDialogTitle>
             <AlertDialogDescription asChild>
               <div className="space-y-2">
                 <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                   <div
                     className="w-10 h-10 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40` }}
                   >
                     {item.badge_icon_url ? (
                       <img src={item.badge_icon_url} alt="" className="w-6 h-6 object-contain" />
                     ) : (
                       <Sparkles className="w-5 h-5" style={{ color }} />
                     )}
                   </div>
                   <div>
                     <p className="font-medium text-foreground text-sm">{item.badge_name}</p>
                     <p className="text-amber-500 text-xs font-semibold">{formatUC(item.price)} UC</p>
                   </div>
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Balance after: <span className="text-foreground font-medium">{formatUC(userBalance - priceBI)} UC</span>
                 </p>
               </div>
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handlePurchase} disabled={purchaseMutation.isPending} className="h-8 text-xs">
               {purchaseMutation.isPending ? 'Buying...' : 'Confirm'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 }