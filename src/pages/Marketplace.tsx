import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Coins,
  Plus,
  Tag,
  Sparkles,
  TrendingUp,
  Package,
  Star,
  Zap,
  Filter,
  Grid3x3,
  List
} from 'lucide-react';

import { ModernHeader } from '@/components/landing/ModernHeader';
import { ModernFooter } from '@/components/landing/ModernFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import {
  useUserBalance,
  useMarketplaceItems,
  useMyMarketplaceItems,
  useMyPurchases
} from '@/hooks/useMarketplace';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';
import { CreateListingDialog } from '@/components/marketplace/CreateListingDialog';
import { cn } from '@/lib/utils';
import { formatUC } from '@/lib/uc';

type ItemFilter = 'all' | 'badge' | 'template';
type ViewMode = 'list' | 'grid';

export default function Marketplace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'browse';

  const [searchQuery, setSearchQuery] = useState('');
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: balance } = useUserBalance();
  const { data: items, isLoading: itemsLoading } = useMarketplaceItems();
  const { data: myItems } = useMyMarketplaceItems();
  const { data: myPurchases } = useMyPurchases();

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const filteredItems = items?.filter(item => {
    const name = item.item_type === 'badge' ? item.badge_name : item.template_name;
    const matchesSearch = !searchQuery ||
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller_username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = itemFilter === 'all' || item.item_type === itemFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalItems: items?.length || 0,
    totalBadges: items?.filter(i => i.item_type === 'badge').length || 0,
    totalTemplates: items?.filter(i => i.item_type === 'template').length || 0,
  };

  const featuredItems = items?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModernHeader />

      <main className="flex-1 pt-20">
        {/* Hero Section with Premium Design */}
        <section className="relative py-20 px-6 overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center mb-16"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-amber-500/20 border border-primary/20 text-sm font-medium mb-6 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  UserVault Marketplace
                </span>
              </motion.div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  Trade & Discover
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
                  Unique Items
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Buy and sell exclusive badges and profile templates.
                <br className="hidden md:block" />
                Create your own listings or discover items from talented creators.
              </p>
            </motion.div>

            {/* Stats & Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-amber-500/50 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
                  {/* Stats */}
                  <div className="flex items-center gap-8 w-full md:w-auto justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center group/stat cursor-default"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover/stat:bg-primary/20 transition-colors">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{stats.totalItems}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Items</p>
                    </motion.div>

                    <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center group/stat cursor-default"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover/stat:bg-amber-500/20 transition-colors">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{stats.totalBadges}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Badges</p>
                    </motion.div>

                    <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="text-center group/stat cursor-default"
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover/stat:bg-primary/20 transition-colors">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{stats.totalTemplates}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Templates</p>
                    </motion.div>
                  </div>

                  {/* Balance & Actions */}
                  <div className="flex items-center gap-4">
                    {user ? (
                      <>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="relative group/balance"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl opacity-50 group-hover/balance:opacity-75 blur transition-opacity" />
                          <div className="relative flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 backdrop-blur-sm">
                            <Coins className="w-6 h-6 text-amber-500" />
                            <div>
                              <p className="font-bold text-amber-500 text-2xl">
                                {formatUC(balance?.balance)}
                              </p>
                              <p className="text-amber-500/70 text-xs uppercase tracking-wide">UC Balance</p>
                            </div>
                          </div>
                        </motion.div>

                        <Button
                          onClick={() => setShowCreateDialog(true)}
                          size="lg"
                          className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="hidden sm:inline">Sell Item</span>
                        </Button>
                      </>
                    ) : (
                      <Button asChild size="lg" className="shadow-lg shadow-primary/25 hover:shadow-primary/40">
                        <Link to="/auth" className="gap-2">
                          <Zap className="w-5 h-5" />
                          Sign in to Trade
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              {/* Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Tabs */}
                <TabsList className="bg-muted/50 backdrop-blur-sm p-1.5 shadow-lg">
                  <TabsTrigger value="browse" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Browse All</span>
                  </TabsTrigger>
                  {user && (
                    <>
                      <TabsTrigger value="my-listings" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Tag className="w-4 h-4" />
                        <span>My Listings</span>
                      </TabsTrigger>
                      <TabsTrigger value="purchases" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Package className="w-4 h-4" />
                        <span>Purchased</span>
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items or creators..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50 backdrop-blur-sm border-border/50 focus:bg-background transition-all"
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 backdrop-blur-sm">
                    {(['all', 'badge', 'template'] as ItemFilter[]).map((filter) => (
                      <Button
                        key={filter}
                        variant="ghost"
                        size="sm"
                        onClick={() => setItemFilter(filter)}
                        className={cn(
                          "capitalize gap-1.5 transition-all",
                          itemFilter === filter && "bg-background shadow-sm"
                        )}
                      >
                        {filter === 'all' ? (
                          <Filter className="w-3.5 h-3.5" />
                        ) : filter === 'badge' ? (
                          <Sparkles className="w-3.5 h-3.5" />
                        ) : (
                          <Package className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {filter === 'all' ? 'All Items' : filter === 'badge' ? 'Badges' : 'Templates'}
                        </span>
                      </Button>
                    ))}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 backdrop-blur-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "w-9 h-9 p-0",
                        viewMode === 'list' && "bg-background shadow-sm"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "w-9 h-9 p-0",
                        viewMode === 'grid' && "bg-background shadow-sm"
                      )}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredItems && filteredItems.length > 0 ? (
                    <>
                      Showing <span className="font-semibold text-foreground">{filteredItems.length}</span> {filteredItems.length === 1 ? 'item' : 'items'}
                    </>
                  ) : null}
                </p>
              </div>

              {/* Tab Contents */}
              <TabsContent value="browse" className="mt-0 space-y-6">
                <MarketplaceGrid
                  items={filteredItems || []}
                  isLoading={itemsLoading}
                  userBalance={balance?.balance ?? 0n}
                  emptyMessage="No items available yet"
                  emptyAction={user ? () => setShowCreateDialog(true) : undefined}
                  emptyActionLabel="Be the first to list something!"
                  viewMode={viewMode}
                />
              </TabsContent>

              <TabsContent value="my-listings" className="mt-0 space-y-6">
                <MarketplaceGrid
                  items={myItems || []}
                  isLoading={false}
                  userBalance={balance?.balance ?? 0n}
                  isOwner
                  emptyMessage="You haven't listed anything yet"
                  emptyAction={() => setShowCreateDialog(true)}
                  emptyActionLabel="Create your first listing"
                  viewMode={viewMode}
                />
              </TabsContent>

              <TabsContent value="purchases" className="mt-0 space-y-6">
                <MarketplaceGrid
                  items={myPurchases?.map(p => p.item as any) || []}
                  isLoading={false}
                  userBalance={balance?.balance ?? 0n}
                  isPurchased
                  emptyMessage="No purchases yet"
                  emptyAction={() => setActiveTab('browse')}
                  emptyActionLabel="Browse the marketplace"
                  viewMode={viewMode}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <ModernFooter />

      <CreateListingDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
