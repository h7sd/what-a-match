import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, Bot, User, Search, Trophy, X, Clock, CheckCircle, XCircle,
  Coins, ShieldCheck, Key, Crown, ChevronLeft, ChevronRight, Minus, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Case, CaseItem } from '@/hooks/useCases';
import { CaseDuel, useCreateDuel, useAcceptDuel, useDeclineDuel, useOpenDuel, useDuels } from '@/hooks/useDuels';
import { BadgeIcon } from './BadgeIcon';
import { DuelOpeningAnimation } from './DuelOpeningAnimation';
import { formatUC } from '@/lib/uc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const rarityColors: Record<string, string> = {
  common: '#b0c3d9', rare: '#5e98d9', epic: '#8b5cf6', legendary: '#eb4b4b', premium: '#ffd700',
};

function ItemDisplay({ item, label, isWinner, isLoser }: {
  item: any; label: string; isWinner?: boolean; isLoser?: boolean;
}) {
  const color = rarityColors[item?.rarity] || '#fff';
  return (
    <div className={cn(
      'flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all',
      isWinner ? 'border-red-500/50 bg-red-500/10' : isLoser ? 'border-red-500/30 bg-red-500/5 opacity-60' : 'border-white/10 bg-white/5'
    )}>
      {isWinner && (
        <div className="flex items-center gap-1 text-xs font-bold text-red-400">
          <Crown className="w-3.5 h-3.5" /> WINNER
        </div>
      )}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}40` }}
      >
        {item?.item_type === 'badge' && item?.badge?.icon_url ? (
          <BadgeIcon iconUrl={item.badge.icon_url} name={item.badge.name} className="w-10 h-10 object-contain" />
        ) : item?.item_type === 'coins' ? (
          <Coins className="w-9 h-9 text-amber-400" />
        ) : item?.item_type === 'premium_key' ? (
          <Key className="w-9 h-9 text-yellow-400" />
        ) : (
          <ShieldCheck className="w-9 h-9" style={{ color }} />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-white">
          {item?.item_type === 'badge' ? (item?.badge?.name || 'Badge')
            : item?.item_type === 'coins' ? `${item.coin_amount} Coins`
            : item?.item_type === 'premium_key' ? 'Premium Key'
            : '?'}
        </p>
        <p className="text-xs capitalize" style={{ color }}>{item?.rarity}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatUC(item?.display_value || 0)} UC</p>
      </div>
    </div>
  );
}

function WaitingPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Clock className="w-8 h-8 text-gray-600 animate-pulse" />
      </div>
      <p className="text-sm text-gray-500">Waiting...</p>
    </div>
  );
}

function DuelCard({ duel, currentUserId, cases }: {
  duel: CaseDuel; currentUserId: string; cases: Case[];
}) {
  const acceptDuel = useAcceptDuel();
  const declineDuel = useDeclineDuel();
  const openDuel = useOpenDuel();
  const [opening, setOpening] = useState(false);
  const [animationData, setAnimationData] = useState<{
    allItems: CaseItem[];
    playerItem: any;
    botItem: any;
    playerWon: boolean;
    tie: boolean;
  } | null>(null);

  const isChallenger = duel.challenger_id === currentUserId;
  const caseName = cases.find(c => c.id === duel.case_id)?.name || 'Unknown Case';
  const myItem = isChallenger ? duel.challenger_item_data : duel.opponent_item_data;
  const theirItem = isChallenger ? duel.opponent_item_data : duel.challenger_item_data;
  const canOpen = duel.status === 'accepted' && !myItem;
  const isPending = duel.status === 'pending' && !isChallenger;

  const userWon = duel.winner_id === currentUserId;
  const botWon = duel.bot_won;
  const completed = duel.status === 'completed';

  const handleOpen = async () => {
    setOpening(true);
    try {
      const { data: caseItemsData } = await supabase
        .from('case_items')
        .select('id, item_type, badge_id, global_badge_id, coin_amount, rarity, drop_rate, display_value, global_badge:global_badges(name, icon_url, color)')
        .eq('case_id', duel.case_id);

      const res = await openDuel.mutateAsync(duel.id);

      const playerItemData = res.item;
      const botItemData = res.duel?.opponent_item_data || res.duel?.challenger_item_data;
      const updatedDuel = res.duel;

      const pWon = updatedDuel?.winner_id === currentUserId;
      const isTie = updatedDuel?.status === 'completed' && !updatedDuel?.winner_id && !updatedDuel?.bot_won;

      setAnimationData({
        allItems: (caseItemsData || []) as CaseItem[],
        playerItem: playerItemData,
        botItem: botItemData,
        playerWon: pWon,
        tie: isTie,
      });
    } catch {
    } finally {
      setOpening(false);
    }
  };

  const handleAnimationDone = () => {
    if (animationData) {
      const { playerWon, tie } = animationData;
      if (playerWon) {
        toast.success('You won the duel!', { duration: 4000 });
      } else if (tie) {
        toast.info("It's a tie!");
      } else {
        toast.error(duel.is_bot_opponent ? 'The bot won this round!' : 'Your opponent won this round!');
      }
    }
    setAnimationData(null);
  };

  const statusConfig = {
    pending: { color: '#f59e0b', label: 'Pending', Icon: Clock },
    accepted: { color: '#3b82f6', label: 'Accepted', Icon: CheckCircle },
    completed: {
      color: completed && userWon ? '#ef4444' : completed && !duel.winner_id ? '#94a3b8' : '#ef4444',
      label: completed ? (userWon ? 'Won' : botWon ? 'Lost to Bot' : duel.winner_id ? 'Lost' : 'Tie') : 'Completed',
      Icon: completed ? Trophy : CheckCircle,
    },
    declined: { color: '#ef4444', label: 'Declined', Icon: XCircle },
    expired: { color: '#6b7280', label: 'Expired', Icon: XCircle },
  };
  const sc = statusConfig[duel.status] || statusConfig.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-white">{caseName}</span>
          {duel.is_bot_opponent && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">vs Bot</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <sc.Icon className="w-3.5 h-3.5" style={{ color: sc.color }} />
          <span className="text-xs font-semibold" style={{ color: sc.color }}>{sc.label}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {animationData ? (
          <DuelOpeningAnimation
            allItems={animationData.allItems}
            playerItem={animationData.playerItem}
            botItem={animationData.botItem}
            playerWon={animationData.playerWon}
            tie={animationData.tie}
            onDone={handleAnimationDone}
            isBot={duel.is_bot_opponent}
          />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5">
                {myItem ? (
                  <ItemDisplay
                    item={myItem}
                    label="You"
                    isWinner={completed && duel.winner_id === currentUserId}
                    isLoser={completed && duel.winner_id !== null && duel.winner_id !== currentUserId}
                  />
                ) : (
                  <WaitingPlaceholder label="You" />
                )}
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-amber-400 font-bold">{formatUC(duel.coins_wagered)}</span>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl bg-white/5">
                {theirItem ? (
                  <ItemDisplay
                    item={theirItem}
                    label={duel.is_bot_opponent ? 'Bot' : 'Opponent'}
                    isWinner={completed && (duel.bot_won || (duel.winner_id && duel.winner_id !== currentUserId))}
                    isLoser={completed && duel.winner_id === currentUserId}
                  />
                ) : (
                  <WaitingPlaceholder label={duel.is_bot_opponent ? 'Bot' : 'Opponent'} />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isPending && (
                <>
                  <Button
                    onClick={() => acceptDuel.mutate(duel.id)}
                    disabled={acceptDuel.isPending}
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                  </Button>
                  <Button
                    onClick={() => declineDuel.mutate(duel.id)}
                    disabled={declineDuel.isPending}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Decline
                  </Button>
                </>
              )}

              {canOpen && (
                <Button
                  onClick={handleOpen}
                  disabled={opening || openDuel.isPending}
                  size="sm"
                  className="w-full text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' }}
                >
                  <Swords className="w-3.5 h-3.5 mr-1.5" />
                  {opening ? 'Opening...' : 'Open Case'}
                </Button>
              )}

              {duel.status === 'pending' && isChallenger && (
                <p className="text-xs text-gray-500 w-full text-center py-1">Waiting for opponent to accept...</p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

interface CreateDuelDialogProps {
  open: boolean;
  onClose: () => void;
  cases: Case[];
  userBalance: bigint;
}

function CaseCountSelector({ count, setCount, max }: { count: number; setCount: (n: number) => void; max: number }) {
  const presets = [1, 5, 10, 25, 50].filter(p => p <= max);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">How many cases? <span className="text-white font-semibold">{count}</span></p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCount(Math.max(1, count - 1))}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all"
        >
          <Minus className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={max}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer"
            style={{
              accentColor: '#3b82f6',
            }}
          />
        </div>
        <button
          onClick={() => setCount(Math.min(max, count + 1))}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => setCount(p)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
              count === p
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
            )}
          >
            {p}x
          </button>
        ))}
      </div>
    </div>
  );
}

function CreateDuelDialog({ open, onClose, cases, userBalance }: CreateDuelDialogProps) {
  const createDuel = useCreateDuel();
  const openDuel = useOpenDuel();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [opponentMode, setOpponentMode] = useState<'bot' | 'user'>('bot');
  const [caseCount, setCaseCount] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [queuedAnimations, setQueuedAnimations] = useState<Array<{
    allItems: CaseItem[];
    playerItem: any;
    botItem: any;
    playerWon: boolean;
    tie: boolean;
    duelIsBot: boolean;
  }>>([]);
  const [currentAnimIdx, setCurrentAnimIdx] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const animationsRef = useRef<typeof queuedAnimations>([]);

  const maxAffordable = selectedCase
    ? Math.min(50, Math.floor(Number(userBalance) / Number(selectedCase.price)))
    : 50;

  const totalCost = selectedCase ? BigInt(selectedCase.price) * BigInt(caseCount) : BigInt(0);
  const canAffordCount = userBalance >= totalCost;

  const handleClose = () => {
    if (isRunning) return;
    setSelectedCase(null);
    setOpponentMode('bot');
    setCaseCount(1);
    setUserSearch('');
    setSearchResults([]);
    setSelectedUser(null);
    onClose();
  };

  const handleSearchUsers = async (q: string) => {
    setUserSearch(q);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .or(`username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%`)
          .limit(8);
        setSearchResults(data || []);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleStart = async () => {
    if (!selectedCase) return;
    if (!canAffordCount) { toast.error('Nicht genug Coins'); return; }

    if (opponentMode === 'user') {
      setIsRunning(true);
      try {
        await createDuel.mutateAsync({
          caseId: selectedCase.id,
          isBotOpponent: false,
          opponentId: selectedUser?.user_id,
        });
        toast.success('Challenge gesendet!');
        handleClose();
      } finally {
        setIsRunning(false);
      }
      return;
    }

    setIsRunning(true);
    animationsRef.current = [];
    setQueuedAnimations([]);
    setCurrentAnimIdx(0);
    setShowAnimation(true);

    const { data: caseItemsData } = await supabase
      .from('case_items')
      .select('id, item_type, badge_id, global_badge_id, coin_amount, rarity, drop_rate, display_value, global_badge:global_badges(name, icon_url, color)')
      .eq('case_id', selectedCase.id);

    for (let i = 0; i < caseCount; i++) {
      try {
        const duel = await createDuel.mutateAsync({
          caseId: selectedCase.id,
          isBotOpponent: true,
        });

        const res = await openDuel.mutateAsync(duel.id);
        const playerItem = res.item;
        const botItem = res.duel?.opponent_item_data;
        const updatedDuel = res.duel;
        const playerWon = updatedDuel?.winner_id != null && updatedDuel.winner_id !== null;
        const isTie = updatedDuel?.status === 'completed' && !updatedDuel?.winner_id && !updatedDuel?.bot_won;

        const entry = {
          allItems: (caseItemsData || []) as CaseItem[],
          playerItem,
          botItem,
          playerWon,
          tie: isTie,
          duelIsBot: true,
        };
        animationsRef.current = [...animationsRef.current, entry];
        setQueuedAnimations([...animationsRef.current]);
      } catch (err: any) {
        toast.error(err.message || 'Fehler beim Öffnen');
        break;
      }
    }

    setIsRunning(false);
  };

  const pendingNextRef = useRef(false);

  const handleAnimDone = () => {
    const next = currentAnimIdx + 1;
    if (next < animationsRef.current.length) {
      setCurrentAnimIdx(next);
      pendingNextRef.current = false;
    } else if (isRunning) {
      pendingNextRef.current = true;
    } else {
      setShowAnimation(false);
      setQueuedAnimations([]);
      animationsRef.current = [];
      onClose();
    }
  };

  useEffect(() => {
    if (pendingNextRef.current) {
      const next = currentAnimIdx + 1;
      if (next < animationsRef.current.length) {
        pendingNextRef.current = false;
        setCurrentAnimIdx(next);
      } else if (!isRunning) {
        pendingNextRef.current = false;
        setShowAnimation(false);
        setQueuedAnimations([]);
        animationsRef.current = [];
        onClose();
      }
    }
  }, [queuedAnimations, isRunning]);

  const currentAnim = queuedAnimations[currentAnimIdx];

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg bg-[#0a0a0f] border-white/10 max-h-[90vh] overflow-y-auto">
          {showAnimation ? (
            <div className="py-4">
              {currentAnim ? (
                <DuelOpeningAnimation
                  allItems={currentAnim.allItems}
                  playerItem={currentAnim.playerItem}
                  botItem={currentAnim.botItem}
                  playerWon={currentAnim.playerWon}
                  tie={currentAnim.tie}
                  onDone={handleAnimDone}
                  isBot={currentAnim.duelIsBot}
                  currentIndex={currentAnimIdx + 1}
                  totalCount={caseCount}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Swords className="w-8 h-8 text-blue-400" />
                  </motion.div>
                  <p className="text-sm font-semibold text-white">Duell wird gestartet...</p>
                </div>
              )}
            </div>
          ) : (
          <>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-blue-400" /> 1v1 Duel erstellen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Wähle eine Kiste</p>
              <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {cases.map((c) => {
                  const canAfford = userBalance >= BigInt(c.price);
                  const accentColor = c.accent_color || '#60a5fa';
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCase(c); setCaseCount(1); }}
                      disabled={!canAfford}
                      className={cn(
                        'relative p-3 rounded-xl border text-left transition-all',
                        selectedCase?.id === c.id
                          ? 'border-blue-500/60 bg-blue-500/10'
                          : canAfford
                          ? 'border-white/10 bg-white/5 hover:border-white/20'
                          : 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
                      )}
                    >
                      {selectedCase?.id === c.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="text-xs font-bold text-white truncate pr-5">{c.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Coins className="w-3 h-3" style={{ color: accentColor }} />
                        <span className="text-xs font-semibold" style={{ color: accentColor }}>{formatUC(c.price)}</span>
                      </div>
                      {!canAfford && <p className="text-[10px] text-red-400 mt-0.5">Nicht genug Coins</p>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOpponentMode('bot')}
                className={cn(
                  'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                  opponentMode === 'bot' ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                )}
              >
                <Bot className={cn('w-7 h-7', opponentMode === 'bot' ? 'text-blue-400' : 'text-gray-500')} />
                <span className={cn('text-sm font-semibold', opponentMode === 'bot' ? 'text-white' : 'text-gray-400')}>vs Bot</span>
                <span className="text-[10px] text-gray-500 text-center">Sofort, kein Warten</span>
              </button>
              <button
                onClick={() => { setOpponentMode('user'); setCaseCount(1); }}
                className={cn(
                  'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                  opponentMode === 'user' ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                )}
              >
                <User className={cn('w-7 h-7', opponentMode === 'user' ? 'text-blue-400' : 'text-gray-500')} />
                <span className={cn('text-sm font-semibold', opponentMode === 'user' ? 'text-white' : 'text-gray-400')}>vs Spieler</span>
                <span className="text-[10px] text-gray-500 text-center">Spieler herausfordern</span>
              </button>
            </div>

            {opponentMode === 'bot' && selectedCase && maxAffordable > 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <CaseCountSelector
                  count={caseCount}
                  setCount={(n) => setCaseCount(Math.min(n, maxAffordable))}
                  max={maxAffordable}
                />
                {caseCount > 1 && (
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-white/5">
                    <span>Gesamtkosten</span>
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span className={cn('font-bold', canAffordCount ? 'text-amber-400' : 'text-red-400')}>
                        {formatUC(Number(totalCost))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {opponentMode === 'user' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Nach Benutzername suchen..."
                    value={userSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                {searching && <p className="text-xs text-gray-500 px-1">Suche...</p>}
                {!searching && userSearch.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-gray-600 px-1">Keine Benutzer gefunden</p>
                )}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-1">
                    {searchResults.map((u) => (
                      <button
                        key={u.user_id}
                        onClick={() => { setSelectedUser(u); setUserSearch(u.username || u.display_name); setSearchResults([]); }}
                        className={cn(
                          'w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left',
                          selectedUser?.user_id === u.user_id ? 'border-blue-500/50 bg-blue-500/10' : 'border-transparent hover:bg-white/5'
                        )}
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.display_name || u.username}</p>
                          {u.display_name && u.username && <p className="text-xs text-gray-500 truncate">@{u.username}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-blue-300 truncate">Fordere heraus: {selectedUser.display_name || selectedUser.username}</span>
                    <button onClick={() => { setSelectedUser(null); setUserSearch(''); }} className="ml-auto text-gray-500 hover:text-white flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}


            <Button
              onClick={handleStart}
              disabled={
                isRunning ||
                !selectedCase ||
                !canAffordCount ||
                (opponentMode === 'user' && !selectedUser)
              }
              className="w-full font-bold"
              style={selectedCase && canAffordCount ? { background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' } : {}}
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Swords className="w-4 h-4" />
                  </motion.span>
                  Verarbeite...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  {opponentMode === 'bot'
                    ? caseCount > 1 ? `${caseCount}x Duell starten` : 'Duell starten'
                    : 'Challenge senden'}
                </span>
              )}
            </Button>
          </div>
          </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface DuelViewProps {
  cases: Case[];
  userBalance: bigint;
}

export function DuelView({ cases, userBalance }: DuelViewProps) {
  const { user } = useAuth();
  const { data: duels, isLoading } = useDuels();
  const [showCreate, setShowCreate] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <Swords className="w-12 h-12 text-gray-600" />
        <p className="text-gray-500">Melde dich an, um das 1v1 Duel-System zu nutzen</p>
      </div>
    );
  }

  const pendingDuels = duels?.filter(d => d.status === 'pending' && d.opponent_id === user.id) || [];
  const activeDuels = duels?.filter(d => (d.status === 'pending' && d.challenger_id === user.id) || d.status === 'accepted') || [];
  const completedDuels = duels?.filter(d => d.status === 'completed' || d.status === 'declined' || d.status === 'expired') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">1v1 Duels</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fordere einen Nutzer oder den Bot heraus. Höchster Drop gewinnt.</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' }}
          className="gap-2 font-bold"
        >
          <Swords className="w-4 h-4" /> Neues Duel
        </Button>
      </div>

      {pendingDuels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Eingehende Herausforderungen</span>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
              {pendingDuels.length}
            </span>
          </div>
          {pendingDuels.map(d => (
            <DuelCard key={d.id} duel={d} currentUserId={user.id} cases={cases} />
          ))}
        </div>
      )}

      {activeDuels.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Aktive Duels</p>
          {activeDuels.map(d => (
            <DuelCard key={d.id} duel={d} currentUserId={user.id} cases={cases} />
          ))}
        </div>
      )}

      {completedDuels.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Vergangene Duels</p>
          {completedDuels.slice(0, 5).map(d => (
            <DuelCard key={d.id} duel={d} currentUserId={user.id} cases={cases} />
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : duels?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Swords className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Noch keine Duels</p>
            <p className="text-sm text-gray-500">Starte dein erstes 1v1 Duel gegen den Bot oder einen Spieler!</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' }}
          >
            <Swords className="w-4 h-4 mr-2" /> Duel starten
          </Button>
        </div>
      )}

      <CreateDuelDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        cases={cases}
        userBalance={userBalance}
      />
    </div>
  );
}
