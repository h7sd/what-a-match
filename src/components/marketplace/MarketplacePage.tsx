import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, Search, ShoppingBag, Tag, Palette, Plus, History, TrendingUp } from 'lucide-react';
import { useUserBalance, useMarketplaceItems, useMyMarketplaceItems, useMyPurchases, useUVTransactions } from '@/hooks/useMarketplace';
import { MarketplaceItemCard } from './MarketplaceItemCard';
import { CreateListingDialog } from './CreateListingDialog';
import { TransactionHistory } from './TransactionHistory';
import { cn } from '@/lib/utils';

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'badge' | 'template'>('all');
  
  const { data: balance } = useUserBalance();
  const { data: items, isLoading: itemsLoading } = useMarketplaceItems();
  const { data: myItems } = useMyMarketplaceItems();
  const { data: myPurchases } = useMyPurchases();
  const { data: transactions } = useUVTransactions();
  
  const filteredItems = items?.filter(item => {
    const matchesSearch = 
      (item.badge_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.template_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       item.seller_username?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = itemTypeFilter === 'all' || item.item_type === itemTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header with Balance */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Buy and sell badges & profile templates
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-500">{balance?.balance?.toLocaleString() || 0} UV</span>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Sell Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="browse" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Browse</span>
          </TabsTrigger>
          <TabsTrigger value="my-items" className="gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">My Listings</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Purchases</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items or sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={itemTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setItemTypeFilter('all')}
              >
                All
              </Button>
              <Button
                variant={itemTypeFilter === 'badge' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setItemTypeFilter('badge')}
              >
                Badges
              </Button>
              <Button
                variant={itemTypeFilter === 'template' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setItemTypeFilter('template')}
              >
                Templates
              </Button>
            </div>
          </div>

          {/* Items Grid */}
          {itemsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <MarketplaceItemCard key={item.id} item={item} userBalance={balance?.balance || 0} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No items found</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Be the first to list something!
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">My Listings</h2>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
          </div>
          
          {myItems && myItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myItems.map(item => (
                <MarketplaceItemCard key={item.id} item={item} isOwner userBalance={balance?.balance || 0} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">You haven't listed anything yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Create your first listing
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <h2 className="text-lg font-semibold">My Purchases</h2>
          
          {myPurchases && myPurchases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPurchases.map(purchase => (
                <MarketplaceItemCard 
                  key={purchase.id} 
                  item={purchase.item as any} 
                  isPurchased 
                  userBalance={balance?.balance || 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No purchases yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setItemTypeFilter('all')}>
                Browse the marketplace
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">UV Transaction History</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Total Earned: {balance?.total_earned?.toLocaleString() || 0} UV</span>
            </div>
          </div>
          
          <TransactionHistory transactions={transactions || []} />
        </TabsContent>
      </Tabs>

      <CreateListingDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
