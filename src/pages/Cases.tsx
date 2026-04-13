import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Coins, Key, Package, Zap, Swords, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ModernHeader } from '@/components/landing/ModernHeader';
import { ModernFooter } from '@/components/landing/ModernFooter';
import { CaseCard } from '@/components/cases/CaseCard';
import { CaseOpeningAnimation } from '@/components/cases/CaseOpeningAnimation';
import { LiveFeed } from '@/components/cases/LiveFeed';
import { InventoryView } from '@/components/cases/InventoryView';
import { DuelView } from '@/components/cases/DuelView';
import { useCases, useOpenCase, useUserBalance } from '@/hooks/useCases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatUC } from '@/lib/uc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type ActiveTab = 'cases' | 'inventory' | 'duel' | 'live';

function BalanceBadge({ balance }: { balance: bigint }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
      <Coins className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-bold text-amber-400">{formatUC(balance.toString())} coins</span>
    </div>
  );
}

function PremiumKeyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 p-4 md:p-5"
      style={{ background: 'linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)' }}
    >
      <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 50%, #ffd700 0%, transparent 60%)' }} />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ffd700, #f59e0b)' }}>
          <Key className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-amber-300">Premium Key</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">Ultra Rare</span>
          </div>
          <p className="text-xs text-amber-200/60 mt-0.5">
            Hidden in every case. Odds: 1 in 50,000. Redeem for Premium membership.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-black text-amber-400">0.002%</p>
          <p className="text-[10px] text-amber-500/60 uppercase tracking-wider">drop chance</p>
        </div>
      </div>
    </motion.div>
  );
}

function WhitelistRequestOverlay({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');

  const { data: existingRequest } = useQuery({
    queryKey: ['whitelist-request', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('case_whitelist_requests')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!username.trim()) throw new Error('Please enter your username');
      const { error } = await supabase
        .from('case_whitelist_requests')
        .upsert({ user_id: userId, username: username.trim(), status: 'pending' }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request submitted! We will review it shortly.');
      queryClient.invalidateQueries({ queryKey: ['whitelist-request', userId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (existingRequest?.status === 'approved') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 gap-6"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <div className="absolute -inset-2 rounded-2xl opacity-20 blur-xl" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        </div>

        <div className="text-center max-w-sm">
          <h3 className="text-xl font-bold text-white mb-2">Beta Access Required</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Case opening is currently in closed beta. Request access by entering your username below and our team will review it.
          </p>
        </div>

        {existingRequest?.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 max-w-sm w-full"
          >
            <Clock className="w-8 h-8 text-blue-400" />
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-300">Request Pending</p>
              <p className="text-xs text-gray-500 mt-1">
                Your request for <span className="text-white font-medium">@{existingRequest.username}</span> is being reviewed.
              </p>
            </div>
          </motion.div>
        )}

        {existingRequest?.status === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-red-500/20 bg-red-500/5 max-w-sm w-full"
          >
            <XCircle className="w-8 h-8 text-red-400" />
            <div className="text-center">
              <p className="text-sm font-semibold text-red-300">Request Rejected</p>
              <p className="text-xs text-gray-500 mt-1">Your previous request was not approved. You may submit a new one.</p>
            </div>
          </motion.div>
        )}

        {(!existingRequest || existingRequest.status === 'rejected') && (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Input
              placeholder="Your username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitMutation.mutate()}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-center"
            />
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!username.trim() || submitMutation.isPending}
              className="gap-2 w-full"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Request Beta Access'}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Cases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: whitelistEntry, isLoading: loadingWhitelist } = useQuery({
    queryKey: ['case-whitelist-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('case_whitelist')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isWhitelisted = !!whitelistEntry;

  const { data: cases, isLoading } = useCases();
  const { data: userBalance = BigInt(0) } = useUserBalance();
  const [activeTab, setActiveTab] = useState<ActiveTab>('cases');
  const [openingCaseId, setOpeningCaseId] = useState<string | null>(null);
  const [animationOpen, setAnimationOpen] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
  const [allCaseItems, setAllCaseItems] = useState<any[]>([]);
  const openCaseMutation = useOpenCase();

  const handleOpenCase = async (caseId: string) => {
    if (!user) return;
    setOpeningCaseId(caseId);

    const { data: fetchedItems } = await supabase
      .from('case_items')
      .select(`
        *,
        badge:badge_id (name, icon_url, color),
        global_badge:global_badge_id (name, icon_url, color)
      `)
      .eq('case_id', caseId)
      .order('drop_rate', { ascending: false });

    openCaseMutation.mutate(caseId, {
      onSuccess: (data) => {
        const serverItem = data.item;
        const normalizedWonItem = {
          ...serverItem,
          drop_rate: serverItem.drop_rate ?? 1,
          badge: serverItem.badge || null,
          global_badge: serverItem.badge || null,
          coin_amount: serverItem.item_type === 'coins' ? Number(serverItem.coin_amount) : null,
        };
        setWonItem(normalizedWonItem);
        setAllCaseItems(fetchedItems && fetchedItems.length > 0 ? fetchedItems : [normalizedWonItem]);
        setAnimationOpen(true);
      },
      onError: () => {
        setOpeningCaseId(null);
      },
    });
  };

  const tabs = [
    { id: 'cases' as ActiveTab, label: 'Cases', icon: Package },
    { id: 'inventory' as ActiveTab, label: 'Inventory', icon: Coins },
    { id: 'duel' as ActiveTab, label: '1v1 Duel', icon: Swords },
    { id: 'live' as ActiveTab, label: 'Live Feed', icon: Zap },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#08080e' }}>
      <ModernHeader />

      <main className="flex-1 pt-20 pb-16">
        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-white/5" style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #08080e 100%)' }}>
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, #3b82f620 0%, transparent 60%)' }} />
          <div className="max-w-6xl mx-auto px-4 py-10 relative">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">UserVault</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Case Opening</h1>
                  <p className="text-sm text-gray-500 mt-1">Open cases to win badges, coins, and the ultra-rare Premium Key</p>
                </div>
                {user && isWhitelisted && <BalanceBadge balance={userBalance} />}
                {!user && (
                  <Button asChild size="sm" className="self-start sm:self-auto">
                    <Link to="/auth">Sign in to Play</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
          {/* Premium Key Banner */}
          <PremiumKeyBanner />

          {/* Tab Bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={activeTab === id ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : { color: '#6b7280' }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Cases Grid */}
          {activeTab === 'cases' && (
            <motion.div key="cases" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!user ? (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">Sign in to Play</h3>
                    <p className="text-sm text-gray-500 max-w-xs mb-4">You need an account to access case opening.</p>
                    <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
                  </div>
                </div>
              ) : loadingWhitelist ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
              ) : !isWhitelisted ? (
                <WhitelistRequestOverlay userId={user.id} />
              ) : isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-72 rounded-2xl animate-pulse bg-white/5" />
                  ))}
                </div>
              ) : cases && cases.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cases.map((c, i) => (
                    <CaseCard
                      key={c.id}
                      case={c}
                      onOpen={handleOpenCase}
                      userBalance={userBalance}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-600">No cases available right now.</div>
              )}

              {/* Rarity legend */}
              {isWhitelisted && (
                <div className="mt-8 flex flex-wrap items-center gap-4 pt-6 border-t border-white/5">
                  <span className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Rarity</span>
                  {[
                    { label: 'Common', color: '#b0c3d9' },
                    { label: 'Rare', color: '#5e98d9' },
                    { label: 'Epic', color: '#a855f7' },
                    { label: 'Legendary', color: '#eb4b4b' },
                    { label: 'Premium', color: '#ffd700' },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium" style={{ color }}>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Inventory */}
          {activeTab === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {user ? <InventoryView /> : (
                <div className="text-center py-16">
                  <p className="text-gray-500 mb-4">Sign in to view your inventory</p>
                  <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Duel */}
          {activeTab === 'duel' && (
            <motion.div key="duel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {!user ? (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">Sign in to Play</h3>
                    <Button asChild size="sm" className="mt-2"><Link to="/auth">Sign in</Link></Button>
                  </div>
                </div>
              ) : loadingWhitelist ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                </div>
              ) : !isWhitelisted ? (
                <WhitelistRequestOverlay userId={user.id} />
              ) : (
                <DuelView cases={cases || []} userBalance={userBalance} />
              )}
            </motion.div>
          )}

          {/* Live Feed */}
          {activeTab === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LiveFeed />
            </motion.div>
          )}
        </div>
      </main>

      <ModernFooter />

      {/* Opening Animation */}
      {animationOpen && wonItem && (
        <CaseOpeningAnimation
          caseId={openingCaseId || ''}
          allItems={allCaseItems}
          wonItem={wonItem}
          open={animationOpen}
          onClose={() => {
            setAnimationOpen(false);
            setWonItem(null);
            setOpeningCaseId(null);
          }}
        />
      )}
    </div>
  );
}
