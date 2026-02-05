 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Coins, ShoppingCart, Check, Clock, X, Package, Eye, Wand2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
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
 import { TemplatePreview } from './TemplatePreview';
 
 interface MarketplaceTemplateCardProps {
   item: MarketplaceItem;
   userBalance: bigint;
   isOwner?: boolean;
   isPurchased?: boolean;
 }
 
 export function MarketplaceTemplateCard({ 
   item, 
   userBalance, 
   isOwner, 
   isPurchased 
 }: MarketplaceTemplateCardProps) {
   const [showConfirm, setShowConfirm] = useState(false);
   const [showApplyConfirm, setShowApplyConfirm] = useState(false);
   const [showPreview, setShowPreview] = useState(false);
   const purchaseMutation = usePurchaseItem();
   const applyTemplateMutation = useApplyTemplate();
 
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
 
   const handleApply = () => {
     applyTemplateMutation.mutate(item.id);
     setShowApplyConfirm(false);
   };
 
   const hasTemplateData = !!item.template_data;
   const templateData = item.template_data as Record<string, unknown> | null;
 
   return (
     <>
       <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         whileHover={{ scale: 1.01 }}
         transition={{ duration: 0.2 }}
         className={cn(
           "group relative rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden",
           "hover:border-primary/30 hover:bg-card/80 transition-all duration-200",
           item.status === 'denied' && "opacity-50",
           isSoldOut && !isPurchased && "opacity-60"
         )}
       >
         {/* Preview thumbnail */}
         <div 
           className="relative h-24 bg-gradient-to-br from-muted/60 to-muted/30 overflow-hidden cursor-pointer"
           onClick={() => hasTemplateData && setShowPreview(true)}
         >
           {item.template_preview_url ? (
             <img
               src={item.template_preview_url}
               alt={item.template_name || 'Template'}
               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
             />
           ) : hasTemplateData ? (
             <div className="w-full h-full">
               <TemplatePreview templateData={templateData} mini />
             </div>
           ) : (
             <div className="w-full h-full flex items-center justify-center">
               <Package className="w-8 h-8 text-muted-foreground/30" />
             </div>
           )}
 
           {/* Preview overlay */}
           {hasTemplateData && (
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
               <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                 <Eye className="w-4 h-4" />
                 Preview
               </div>
             </div>
           )}
 
           {/* Status badges */}
           <div className="absolute top-2 right-2 flex gap-1">
             {isPurchased && (
               <Badge className="bg-emerald-500/90 text-white border-0 text-[10px] px-1.5 py-0">
                 <Check className="w-2.5 h-2.5 mr-0.5" />
                 Owned
               </Badge>
             )}
             {item.status === 'pending' && (
               <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                 <Clock className="w-2.5 h-2.5 mr-0.5" />
                 Pending
               </Badge>
             )}
             {isSoldOut && !isPurchased && (
               <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Sold</Badge>
             )}
           </div>
         </div>
 
         {/* Content */}
         <div className="p-3">
           <div className="flex items-start justify-between gap-2">
             <div className="min-w-0">
               <h3 className="font-medium text-sm text-foreground truncate">
                 {item.template_name || 'Unnamed Template'}
               </h3>
               <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                 @{item.seller_username || 'unknown'}
               </p>
             </div>
 
             <div className="shrink-0 flex items-center gap-1.5">
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
                   className="h-6 w-6 p-0"
                 >
                   <ShoppingCart className="w-3 h-3" />
                 </Button>
               )}
 
               {isPurchased && hasTemplateData && (
                 <Button
                   size="sm"
                   variant="secondary"
                   onClick={() => setShowApplyConfirm(true)}
                   disabled={applyTemplateMutation.isPending}
                   className="h-6 px-2 text-[10px]"
                 >
                   <Wand2 className="w-3 h-3 mr-1" />
                   Apply
                 </Button>
               )}
             </div>
           </div>
         </div>
       </motion.div>
 
       {/* Full Preview Dialog */}
       <Dialog open={showPreview} onOpenChange={setShowPreview}>
         <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
           <DialogHeader className="p-4 pb-2">
             <DialogTitle className="text-base">{item.template_name || 'Template Preview'}</DialogTitle>
           </DialogHeader>
           <div className="px-4 pb-4">
             <div className="rounded-lg overflow-hidden border border-border/50 aspect-[9/16] max-h-[60vh]">
               <TemplatePreview templateData={templateData} />
             </div>
           </div>
         </DialogContent>
       </Dialog>
 
       {/* Purchase Dialog */}
       <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
         <AlertDialogContent className="max-w-sm">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-base">Buy Template</AlertDialogTitle>
             <AlertDialogDescription asChild>
               <div className="space-y-2">
                 <p className="text-sm">
                   Buy <strong>{item.template_name}</strong> for <strong className="text-amber-500">{formatUC(item.price)} UC</strong>?
                 </p>
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
 
       {/* Apply Dialog */}
       <AlertDialog open={showApplyConfirm} onOpenChange={setShowApplyConfirm}>
         <AlertDialogContent className="max-w-sm">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-base">Apply Template</AlertDialogTitle>
             <AlertDialogDescription asChild>
               <div className="space-y-2">
                 <p className="text-sm">Apply <strong>{item.template_name}</strong> to your profile?</p>
                 <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
                   ⚠️ This overwrites your current style settings.
                 </div>
               </div>
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleApply} disabled={applyTemplateMutation.isPending} className="h-8 text-xs">
               {applyTemplateMutation.isPending ? 'Applying...' : 'Apply'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 }