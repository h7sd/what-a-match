import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Coins, 
  Search, 
  ShoppingBag, 
  Tag, 
  Plus, 
  History, 
  TrendingUp,
  ExternalLink,
  Package
} from 'lucide-react';
import { 
  useUserBalance, 
  useMarketplaceItems, 
  useMyMarketplaceItems, 
  useMyPurchases, 
  useUCTransactions 
} from '@/hooks/useMarketplace';
import { MarketplaceGrid } from './MarketplaceGrid';
import { CreateListingDialog } from './CreateListingDialog';
import { TransactionHistory } from './TransactionHistory';
import { cn } from '@/lib/utils';

type ItemFilter = 'all' | 'badge' | 'template';

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
  
  const { data: balance } = useUserBalance();
  const { data: items, isLoading: itemsLoading } = useMarketplaceItems();
  const { data: myItems } = useMyMarketplaceItems();
  const { data: myPurchases } = useMyPurchases();
  const { data: transactions } = useUCTransactions();
  
  const filteredItems = items?.filter(item => {
    const name = item.item_type === 'badge' ? item.badge_name : item.template_name;
    const matchesSearch = !searchQuery ||
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller_username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = itemFilter === 'all' || item.item_type === itemFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-500">
              {balance?.balance?.toLocaleString() || 0} UC
            </span>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Sell Item
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link to="/marketplace">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="browse" className="gap-2 data-[state=active]:bg-background">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="my-items" className="gap-2 data-[state=active]:bg-background">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">My Listings</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2 data-[state=active]:bg-background">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Purchases</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-background">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48 bg-muted/50"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              {(['all', 'badge', 'template'] as ItemFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant="ghost"
                  size="sm"
                  onClick={() => setItemFilter(filter)}
                  className={cn(
                    "capitalize text-xs px-2",
                    itemFilter === filter && "bg-background shadow-sm"
                  )}
                >
                  {filter === 'all' ? 'All' : filter === 'badge' ? 'Badges' : 'Templates'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <TabsContent value="browse" className="mt-0">
          <MarketplaceGrid 
            items={filteredItems || []} 
            isLoading={itemsLoading}
            userBalance={balance?.balance || 0}
            emptyMessage="No items found"
            emptyAction={() => setShowCreateDialog(true)}
            emptyActionLabel="Be the first to list something!"
          />
        </TabsContent>

        <TabsContent value="my-items" className="mt-0">
          <MarketplaceGrid 
            items={myItems || []} 
            isLoading={false}
            userBalance={balance?.balance || 0}
            isOwner
            emptyMessage="You haven't listed anything yet"
            emptyAction={() => setShowCreateDialog(true)}
            emptyActionLabel="Create your first listing"
          />
        </TabsContent>

        <TabsContent value="purchases" className="mt-0">
          <MarketplaceGrid 
            items={myPurchases?.map(p => p.item as any) || []} 
            isLoading={false}
            userBalance={balance?.balance || 0}
            isPurchased
            emptyMessage="No purchases yet"
          />
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">UC Transaction History</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Total Earned: {balance?.total_earned?.toLocaleString() || 0} UC</span>
            </div>
          </div>
          <TransactionHistory transactions={transactions || []} />
        </TabsContent>
      </Tabs>

      <CreateListingDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
