import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Check, X, Coins, User, Clock, Sparkles, Package } from 'lucide-react';
import { usePendingMarketplaceItems, useReviewMarketplaceItem, MarketplaceItem } from '@/hooks/useMarketplace';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function AdminMarketplaceManager() {
  const { data: pendingItems, isLoading } = usePendingMarketplaceItems();
  const reviewMutation = useReviewMarketplaceItem();
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyDialog, setShowDenyDialog] = useState(false);

  const handleApprove = (item: MarketplaceItem) => {
    reviewMutation.mutate({ itemId: item.id, action: 'approved' });
  };

  const handleDeny = () => {
    if (!selectedItem) return;
    reviewMutation.mutate({ 
      itemId: selectedItem.id, 
      action: 'denied', 
      reason: denyReason 
    });
    setShowDenyDialog(false);
    setDenyReason('');
    setSelectedItem(null);
  };

  const openDenyDialog = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setShowDenyDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Marketplace Approvals
          {pendingItems && pendingItems.length > 0 && (
            <Badge variant="secondary">{pendingItems.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : pendingItems && pendingItems.length > 0 ? (
          <div className="space-y-3">
            {pendingItems.map(item => {
              const name = item.item_type === 'badge' ? item.badge_name : item.template_name;
              const description = item.item_type === 'badge' ? item.badge_description : item.template_description;
              const iconUrl = item.item_type === 'badge' ? item.badge_icon_url : item.template_preview_url;
              const color = item.badge_color || '#8B5CF6';

              return (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start gap-4">
                    {/* Item Preview */}
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: item.item_type === 'badge' ? `${color}20` : undefined,
                        border: item.item_type === 'badge' ? `2px solid ${color}` : undefined
                      }}
                    >
                      {iconUrl ? (
                        <img src={iconUrl} alt={name || ''} className="w-10 h-10 object-contain" />
                      ) : item.item_type === 'badge' ? (
                        <Sparkles className="w-6 h-6" style={{ color }} />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{name || 'Unnamed'}</h3>
                        <Badge variant="outline">
                          {item.item_type === 'badge' ? 'Badge' : 'Template'}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {item.sale_type}
                          {item.sale_type === 'limited' && ` (${item.stock_limit})`}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {description || 'No description'}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.seller_username}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-amber-500">
                          <Coins className="w-3 h-3" />
                          {item.price.toLocaleString()} UV
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(item.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={() => handleApprove(item)}
                        disabled={reviewMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => openDenyDialog(item)}
                        disabled={reviewMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pending items to review</p>
          </div>
        )}
      </CardContent>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Listing</DialogTitle>
            <DialogDescription>
              Provide a reason for denying "{selectedItem?.badge_name || selectedItem?.template_name}".
              The seller will see this message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for denial..."
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDenyDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeny} disabled={reviewMutation.isPending}>
              Deny Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
