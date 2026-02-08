import { motion } from 'framer-motion';
import { Package, Coins, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCaseTransactions } from '@/hooks/useCases';
import { formatUC } from '@/lib/uc';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const rarityColors = {
  common: 'text-gray-400 bg-gray-500/10',
  rare: 'text-blue-400 bg-blue-500/10',
  epic: 'text-purple-400 bg-purple-500/10',
  legendary: 'text-amber-400 bg-amber-500/10',
  premium: 'text-pink-400 bg-pink-500/10',
};

export function TransactionHistory() {
  const { data: transactions, isLoading } = useCaseTransactions();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <Package className="relative w-16 h-16 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No transaction history yet</h3>
        <p className="text-muted-foreground">
          Open your first case to start building your history
        </p>
      </motion.div>
    );
  }

  const totalOpened = transactions.length;
  const totalValue = transactions.reduce((sum, t) => sum + BigInt(t.total_value), 0n);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOpened}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Cases Opened
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{formatUC(totalValue)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Value Won
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {transactions.flatMap((t) => t.items_won).length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Items Won
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 hover:bg-card/80 hover:border-border/60 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Case Image */}
                <div className="w-16 h-16 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                  {transaction.case.image_url ? (
                    <img
                      src={transaction.case.image_url}
                      alt={transaction.case.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{transaction.case.name}</h4>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase"
                    >
                      {transaction.transaction_type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {transaction.items_won.length} item{transaction.items_won.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Items Won Preview */}
                <div className="hidden lg:flex items-center gap-2">
                  {transaction.items_won.slice(0, 3).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        'w-12 h-12 rounded-lg border-2 flex items-center justify-center',
                        rarityColors[item.rarity as keyof typeof rarityColors]
                      )}
                    >
                      {item.item_type === 'badge' && item.badge?.icon_url ? (
                        <img
                          src={item.badge.icon_url}
                          alt=""
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Coins className="w-6 h-6 text-amber-500" />
                      )}
                    </div>
                  ))}
                  {transaction.items_won.length > 3 && (
                    <div className="w-12 h-12 rounded-lg border-2 border-border bg-muted/50 flex items-center justify-center text-xs font-semibold">
                      +{transaction.items_won.length - 3}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-500">
                      {formatUC(transaction.total_value)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
