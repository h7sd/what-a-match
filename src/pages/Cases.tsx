import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Sparkles,
  Coins,
  History,
  TrendingUp,
  Info,
  Lock,
  ChevronRight,
  Sword
} from 'lucide-react';
import { ModernHeader } from '@/components/landing/ModernHeader';
import { ModernFooter } from '@/components/landing/ModernFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { useCases } from '@/hooks/useCases';
import { useUserBalance } from '@/hooks/useMarketplace';
import { formatUC } from '@/lib/uc';
import { CaseCard } from '@/components/cases/CaseCard';
import { CaseOpeningDialog } from '@/components/cases/CaseOpeningDialog';
import { InventoryView } from '@/components/cases/InventoryView';
import { TransactionHistory } from '@/components/cases/TransactionHistory';
import { cn } from '@/lib/utils';

export default function Cases() {
  const { user } = useAuth();
  const { data: cases, isLoading } = useCases();
  const { data: balance } = useUserBalance();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);

  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setShowOpenDialog(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModernHeader />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              {/* Badge */}
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

              {/* Title */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  Open Cases &
                </span>
                <br />
                <span className="bg-gradient-to-r from-amber-500 via-primary to-amber-500 bg-clip-text text-transparent">
                  Win Big
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Unlock exclusive badges and coins from premium cases.
                <br className="hidden md:block" />
                Test your luck with provably fair RNG system.
              </p>
            </motion.div>

            {/* Balance Card */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 via-primary/50 to-amber-500/50 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500" />

                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
                    {/* Balance */}
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
                          <p className="text-amber-500/70 text-xs uppercase tracking-wide">Your Balance</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3">
                      <Button variant="outline" asChild className="gap-2">
                        <Link to="/cases?tab=inventory">
                          <Package className="w-4 h-4" />
                          Inventory
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="gap-2">
                        <Link to="/cases?tab=battles">
                          <Sword className="w-4 h-4" />
                          Battles
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="gap-2">
                        <Link to="/cases?tab=history">
                          <History className="w-4 h-4" />
                          History
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Not Logged In CTA */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="max-w-2xl mx-auto text-center"
              >
                <div className="p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sign in to Start Opening Cases</h3>
                  <p className="text-muted-foreground mb-6">
                    Create an account to unlock exclusive badges and win amazing rewards.
                  </p>
                  <Button asChild size="lg" className="gap-2">
                    <Link to="/auth">
                      <Sparkles className="w-5 h-5" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Main Content */}
        {user && (
          <section className="py-12 px-6">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="cases" className="space-y-8">
                <TabsList className="bg-muted/50 backdrop-blur-sm p-1.5 shadow-lg">
                  <TabsTrigger value="cases" className="gap-2">
                    <Package className="w-4 h-4" />
                    Cases
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="battles" className="gap-2">
                    <Sword className="w-4 h-4" />
                    Battles
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="w-4 h-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cases" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Available Cases</h2>
                      <p className="text-sm text-muted-foreground">Choose a case to open and win exclusive items</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Info className="w-3 h-3" />
                      Provably Fair
                    </Badge>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-80 rounded-2xl bg-muted/50 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                        {cases?.map((caseItem, index) => (
                          <CaseCard
                            key={caseItem.id}
                            case={caseItem}
                            onOpen={handleOpenCase}
                            userBalance={balance?.balance ?? 0n}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {!isLoading && (!cases || cases.length === 0) && (
                    <div className="text-center py-20">
                      <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-muted-foreground">No cases available at the moment</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="inventory">
                  <InventoryView />
                </TabsContent>

                <TabsContent value="battles">
                  <div className="text-center py-20">
                    <Sword className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Battle System Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Compete against other players in 2v2 and 4v4 case battles!
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <TransactionHistory />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}
      </main>

      <ModernFooter />

      {selectedCaseId && (
        <CaseOpeningDialog
          caseId={selectedCaseId}
          open={showOpenDialog}
          onOpenChange={setShowOpenDialog}
        />
      )}
    </div>
  );
}
