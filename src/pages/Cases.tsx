import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Coins, ShoppingBag, History, TrendingUp } from 'lucide-react';
import { ModernHeader } from '@/components/landing/ModernHeader';
import { ModernFooter } from '@/components/landing/ModernFooter';
import { CaseCard } from '@/components/cases/CaseCard';
import { CaseOpeningDialog } from '@/components/cases/CaseOpeningDialog';
import { InventoryView } from '@/components/cases/InventoryView';
import { LiveFeed } from '@/components/cases/LiveFeed';
import { TransactionHistory } from '@/components/cases/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useCases } from '@/hooks/useCases';
import { formatUC } from '@/lib/uc';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Cases() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const { data: cases, isLoading: casesLoading, error: casesError } = useCases();

  console.log('[Cases Page] Loading:', casesLoading);
  console.log('[Cases Page] Cases:', cases);
  console.log('[Cases Page] Error:', casesError);

  const { data: userBalance } = useQuery({
    queryKey: ['user-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { balance: '0' };

      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return { balance: data?.balance?.toString() || '0' };
    },
  });

  const balance = userBalance?.balance ? BigInt(userBalance.balance) : BigInt(0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModernHeader />

      <main className="flex-1 pt-20 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <section className="relative py-12 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center mb-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-primary/10 to-amber-500/20 border border-amber-500/20 text-sm font-medium mb-6 backdrop-blur-sm"
                >
                  <Package className="w-4 h-4 text-amber-500" />
                  <span className="bg-gradient-to-r from-amber-500 to-primary bg-clip-text text-transparent">
                    Case Opening System
                  </span>
                </motion.div>

                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
                  Open Cases & Win Prizes
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Open cases to win exclusive badges, coins, and more. Try your luck!
                </p>

                <Card className="inline-flex items-center gap-3 px-6 py-4 mt-8 bg-gradient-to-r from-amber-500/10 to-primary/10 border-amber-500/20">
                  <Coins className="w-6 h-6 text-amber-500" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Your Balance</p>
                    <p className="text-2xl font-bold text-amber-500">
                      {formatUC(userBalance?.balance || '0')}
                    </p>
                  </div>
                </Card>
              </motion.div>

              <Tabs defaultValue="cases" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="cases" className="gap-2">
                    <Package className="w-4 h-4" />
                    Cases
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="live" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Live Feed
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cases" className="space-y-8">
                  {casesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[400px] rounded-2xl" />
                      ))}
                    </div>
                  ) : cases && cases.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cases.map((caseItem, index) => (
                        <CaseCard
                          key={caseItem.id}
                          case={caseItem}
                          onOpen={setSelectedCaseId}
                          userBalance={balance}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Cases Available</h3>
                      <p className="text-muted-foreground">
                        Check back later for new cases!
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="inventory">
                  <InventoryView />
                </TabsContent>

                <TabsContent value="history">
                  <TransactionHistory />
                </TabsContent>

                <TabsContent value="live">
                  <LiveFeed />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>
      </main>

      <CaseOpeningDialog
        caseId={selectedCaseId || ''}
        open={!!selectedCaseId}
        onOpenChange={(open) => !open && setSelectedCaseId(null)}
      />

      <ModernFooter />
    </div>
  );
}
