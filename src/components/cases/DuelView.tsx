import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Bot, User, Search, Trophy, X, Clock, CheckCircle, XCircle,
  Coins, ShieldCheck, Key, Sparkles, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Case } from '@/hooks/useCases';
import { CaseDuel, useCreateDuel, useAcceptDuel, useDeclineDuel, useOpenDuel, useDuels } from '@/hooks/useDuels';
import { BadgeIcon } from './BadgeIcon';
import { formatUC } from '@/lib/uc';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const rarityColors: Record<string, string> = {
  common: '#b0c3d9', rare: '#5e98d9', epic: '#a855f7', legendary: '#eb4b4b', premium: '#ffd700',
};

function ItemDisplay({ item, label, isWinner, isLoser }: {
  item: any; label: string; isWinner?: boolean; isLoser?: boolean;
}) {
  const color = rarityColors[item?.rarity] || '#fff';
  return (
    <div className={cn(
      'flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all',
      isWinner ? 'border-green-500/50 bg-green-500/10' : isLoser ? 'border-red-500/30 bg-red-500/5 opacity-60' : 'border-white/10 bg-white/5'
    )}>
      {isWinner && (
        <div className="flex items-center gap-1 text-xs font-bold text-green-400">
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
  const [result, setResult] = useState<any>(null);

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
      const res = await openDuel.mutateAsync(duel.id);
      setResult(res);
      if (res.duel?.status === 'completed') {
        if (res.duel.winner_id === currentUserId) {
          toast.success('You won the duel!', { duration: 5000 });
        } else if (res.duel.bot_won) {
          toast.error('The bot won this round!');
        } else if (!res.duel.winner_id) {
          toast.info("It's a tie!");
        } else {
          toast.error('Your opponent won this round!');
        }
      }
    } finally {
      setOpening(false);
    }
  };

  const statusConfig = {
    pending: { color: '#f59e0b', label: 'Pending', Icon: Clock },
    accepted: { color: '#3b82f6', label: 'Accepted', Icon: CheckCircle },
    completed: { color: completed && userWon ? '#22c55e' : completed && !duel.winner_id ? '#94a3b8' : '#ef4444', label: completed ? (userWon ? 'Won' : botWon ? 'Lost to Bot' : duel.winner_id ? 'Lost' : 'Tie') : 'Completed', Icon: completed ? Trophy : CheckCircle },
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
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs"
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

function CreateDuelDialog({ open, onClose, cases, userBalance }: CreateDuelDialogProps) {
  const createDuel = useCreateDuel();
  const [step, setStep] = useState<'case' | 'opponent'>('case');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [opponentMode, setOpponentMode] = useState<'bot' | 'user'>('bot');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const handleClose = () => {
    setStep('case');
    setSelectedCase(null);
    setOpponentMode('bot');
    setUserSearch('');
    setSearchResults([]);
    setSelectedUser(null);
    onClose();
  };

  const handleSearchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .ilike('username', `%${q}%`)
        .limit(5);
      setSearchResults(data || []);
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedCase) return;
    if (BigInt(selectedCase.price) > userBalance) {
      toast.error('Insufficient coins');
      return;
    }

    await createDuel.mutateAsync({
      caseId: selectedCase.id,
      isBotOpponent: opponentMode === 'bot',
      opponentId: opponentMode === 'user' ? selectedUser?.user_id : undefined,
    });
    handleClose();
    toast.success(opponentMode === 'bot' ? 'Bot duel started! Go open the case.' : 'Challenge sent!');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[#0a0a0f] border-white/10 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-blue-400" /> Create 1v1 Duel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {['Select Case', 'Choose Opponent'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  (step === 'case' && i === 0) || (step === 'opponent' && i === 1)
                    ? 'bg-blue-500 text-white'
                    : step === 'opponent' && i === 0
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-500'
                )}>
                  {step === 'opponent' && i === 0 ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium', (step === 'case' && i === 0) || (step === 'opponent' && i === 1) ? 'text-white' : 'text-gray-500')}>
                  {s}
                </span>
                {i === 0 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          {/* Step 1: Case selection */}
          {step === 'case' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Pick a case to open in the duel. Both players open the same case.</p>
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {cases.map((c) => {
                  const canAfford = userBalance >= BigInt(c.price);
                  const accentColor = c.accent_color || '#60a5fa';
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
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
                      {!canAfford && <p className="text-[10px] text-red-400 mt-0.5">Not enough coins</p>}
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => setStep('opponent')}
                disabled={!selectedCase}
                className="w-full"
                style={selectedCase ? { background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' } : {}}
              >
                Next: Choose Opponent
              </Button>
            </div>
          )}

          {/* Step 2: Opponent */}
          {step === 'opponent' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Selected Case</p>
                  <p className="text-sm font-bold text-white">{selectedCase?.name}</p>
                </div>
                <button onClick={() => setStep('case')} className="text-xs text-blue-400 hover:text-blue-300">Change</button>
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
                  <span className="text-[10px] text-gray-500 text-center">Instant, no waiting</span>
                </button>
                <button
                  onClick={() => setOpponentMode('user')}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                    opponentMode === 'user' ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                  )}
                >
                  <User className={cn('w-7 h-7', opponentMode === 'user' ? 'text-blue-400' : 'text-gray-500')} />
                  <span className={cn('text-sm font-semibold', opponentMode === 'user' ? 'text-white' : 'text-gray-400')}>vs Player</span>
                  <span className="text-[10px] text-gray-500 text-center">Challenge a user</span>
                </button>
              </div>

              {opponentMode === 'user' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search by username..."
                      value={userSearch}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  {searching && <p className="text-xs text-gray-500 px-1">Searching...</p>}
                  {searchResults.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {searchResults.map((u) => (
                        <button
                          key={u.user_id}
                          onClick={() => { setSelectedUser(u); setUserSearch(u.username || u.display_name); setSearchResults([]); }}
                          className={cn(
                            'w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left',
                            selectedUser?.user_id === u.user_id ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5 hover:bg-white/5'
                          )}
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-white">{u.display_name || u.username}</p>
                            {u.display_name && <p className="text-xs text-gray-500">@{u.username}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-blue-300">Challenging: {selectedUser.display_name || selectedUser.username}</span>
                      <button onClick={() => setSelectedUser(null)} className="ml-auto text-gray-500 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 space-y-1">
                <p className="font-semibold text-amber-300">How it works</p>
                <p>Both players open the same case. The player who wins the higher-value item wins the duel and earns the opponent's item value as bonus coins.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep('case')} className="flex-1 border-white/10 text-gray-400">
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createDuel.isPending || (opponentMode === 'user' && !selectedUser)}
                  className="flex-1"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' }}
                >
                  <Swords className="w-4 h-4 mr-1.5" />
                  {createDuel.isPending ? 'Creating...' : opponentMode === 'bot' ? 'Start Bot Duel' : 'Send Challenge'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
        <p className="text-gray-500">Sign in to use the 1v1 duel system</p>
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
          <p className="text-sm text-gray-500 mt-0.5">Challenge a user or the bot. Higher drop wins.</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' }}
          className="gap-2 font-bold"
        >
          <Swords className="w-4 h-4" /> New Duel
        </Button>
      </div>

      {pendingDuels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Incoming Challenges</span>
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
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Active Duels</p>
          {activeDuels.map(d => (
            <DuelCard key={d.id} duel={d} currentUserId={user.id} cases={cases} />
          ))}
        </div>
      )}

      {completedDuels.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Past Duels</p>
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
            <p className="text-white font-semibold mb-1">No duels yet</p>
            <p className="text-sm text-gray-500">Start your first 1v1 duel against a bot or another player!</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#000' }}
          >
            <Swords className="w-4 h-4 mr-2" /> Start a Duel
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
