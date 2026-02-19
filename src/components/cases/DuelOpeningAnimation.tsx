import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, Key, ShieldCheck, Swords, Crown, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatUC } from '@/lib/uc';
import { CaseItem } from '@/hooks/useCases';
import { cn } from '@/lib/utils';

interface DuelOpeningAnimationProps {
  allItems: CaseItem[];
  playerItem: CaseItem;
  botItem: CaseItem;
  playerWon: boolean;
  tie: boolean;
  open: boolean;
  onClose: () => void;
  isBot?: boolean;
}

const rarityColors = {
  common:    { bg: '#b0c3d9', border: '#b0c3d9', glow: 'rgba(176,195,217,0.5)' },
  uncommon:  { bg: '#4ade80', border: '#4ade80', glow: 'rgba(74,222,128,0.5)' },
  rare:      { bg: '#5e98d9', border: '#5e98d9', glow: 'rgba(94,152,217,0.5)' },
  epic:      { bg: '#8b5cf6', border: '#8b5cf6', glow: 'rgba(139,92,246,0.5)' },
  legendary: { bg: '#eb4b4b', border: '#eb4b4b', glow: 'rgba(235,75,75,0.5)' },
  premium:   { bg: '#ffd700', border: '#ffd700', glow: 'rgba(255,215,0,0.9)' },
};

function isSvgString(str: string | null): boolean {
  return !!str && str.trim().startsWith('<svg');
}

function BadgeImage({ iconUrl, name, className, style }: { iconUrl: string | null; name: string; className?: string; style?: React.CSSProperties }) {
  if (!iconUrl) return null;
  if (isSvgString(iconUrl)) {
    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: iconUrl }} />;
  }
  return <img src={iconUrl} alt={name} className={className} style={style} />;
}

function getItemDisplay(item: CaseItem) {
  const badge = item.badge || item.global_badge;
  if (item.item_type === 'premium_key') return { name: 'Premium Key', icon: null, isPremiumKey: true, isCoins: false, isBadge: false };
  if (item.item_type === 'coins') return { name: `${item.coin_amount} Coins`, icon: null, isPremiumKey: false, isCoins: true, isBadge: false };
  return { name: badge?.name || 'Badge', icon: badge?.icon_url || null, isPremiumKey: false, isCoins: false, isBadge: true };
}

function weightedPick(pool: CaseItem[]): CaseItem {
  const totalRate = pool.reduce((s, it) => s + Number(it.drop_rate), 0);
  const rand = Math.random() * totalRate;
  let cum = 0;
  for (const it of pool) {
    cum += Number(it.drop_rate);
    if (rand <= cum) return it;
  }
  return pool[pool.length - 1];
}

function buildDisplayPool(allItems: CaseItem[], wonItem: CaseItem): CaseItem[] {
  if (allItems.length === 0) return [wonItem];
  const seen = new Set<string>();
  const pool: CaseItem[] = [];
  for (const item of allItems) {
    const key = item.item_type === 'coins'
      ? `coins-${item.coin_amount}`
      : item.item_type === 'premium_key'
      ? 'premium_key'
      : `badge-${item.global_badge_id || item.badge_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      pool.push(item);
    }
  }
  return pool.length > 0 ? pool : [wonItem];
}

function generateVerticalStrip(allItems: CaseItem[], wonItem: CaseItem): CaseItem[] {
  const strip: CaseItem[] = [];
  const winIndex = 45;
  const pool = buildDisplayPool(allItems, wonItem);
  for (let i = 0; i < 80; i++) {
    if (i === winIndex) {
      strip.push(wonItem);
    } else {
      const r = weightedPick(pool);
      strip.push({ ...r, id: `${r.id}-${i}` });
    }
  }
  return strip;
}

const ITEM_HEIGHT = 110;
const ITEM_GAP = 8;
const ITEM_TOTAL = ITEM_HEIGHT + ITEM_GAP;
const WIN_INDEX = 45;
const SPIN_DURATION_MS = 5000;

function VerticalStripItem({ item, isCenter }: { item: CaseItem; isCenter?: boolean }) {
  const display = getItemDisplay(item);
  const colors = rarityColors[item.rarity as keyof typeof rarityColors] || rarityColors.common;
  return (
    <div
      className={cn(
        'flex-shrink-0 w-full rounded-xl flex items-center gap-3 px-3 border-2 transition-all',
        isCenter && 'border-opacity-100'
      )}
      style={{
        height: ITEM_HEIGHT,
        backgroundColor: `${colors.bg}15`,
        borderColor: isCenter ? colors.border : `${colors.border}40`,
        boxShadow: isCenter ? `0 0 20px ${colors.glow}` : 'none',
      }}
    >
      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
        {display.isPremiumKey ? (
          <Key className="w-9 h-9" style={{ color: colors.bg }} />
        ) : display.isCoins ? (
          <Coins className="w-9 h-9 text-amber-400" />
        ) : display.icon ? (
          <BadgeImage iconUrl={display.icon} name={display.name} className="w-12 h-12 object-contain" />
        ) : (
          <ShieldCheck className="w-9 h-9" style={{ color: colors.bg }} />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{display.name}</p>
        <span
          className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${colors.bg}25`, color: colors.bg }}
        >
          {item.rarity}
        </span>
        <p className="text-[10px] text-gray-500 mt-0.5">{formatUC(item.display_value)} UC</p>
      </div>
    </div>
  );
}

function useDuelSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const scheduleTicksForAnimation = useCallback((durationMs: number) => {
    try {
      const ctx = getCtx();
      const startAudioTime = ctx.currentTime + 0.05;
      const totalDistance = 80 * ITEM_TOTAL;
      let itemsCrossed = 0;

      for (let ms = 0; ms <= durationMs; ms += 16) {
        const t = ms / durationMs;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const pos = eased * totalDistance;
        const newItemsCrossed = Math.floor(pos / ITEM_TOTAL);
        if (newItemsCrossed > itemsCrossed) {
          itemsCrossed = newItemsCrossed;
          const audioTime = startAudioTime + ms / 1000;
          const speed = Math.max(0, 1 - t);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(300 + speed * 500, audioTime);
          gain.gain.setValueAtTime(Math.min(0.08, 0.02 + speed * 0.07), audioTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.05);
          osc.start(audioTime);
          osc.stop(audioTime + 0.06);
        }
      }
    } catch {}
  }, [getCtx]);

  const playReveal = useCallback((won: boolean, tie: boolean) => {
    try {
      const ctx = getCtx();
      const freqs = won
        ? [523, 659, 784, 1047]
        : tie
        ? [370, 466, 587]
        : [220, 277, 330];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } catch {}
  }, [getCtx]);

  return { scheduleTicksForAnimation, playReveal };
}

function SpinColumn({
  allItems,
  wonItem,
  label,
  spinning,
}: {
  allItems: CaseItem[];
  wonItem: CaseItem;
  label: string;
  spinning: boolean;
}) {
  const [strip] = useState(() => generateVerticalStrip(allItems, wonItem));
  const visibleHeight = 330;
  const centerOffset = Math.floor(visibleHeight / 2) - Math.floor(ITEM_HEIGHT / 2);
  const targetY = -(WIN_INDEX * ITEM_TOTAL) + centerOffset;

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40"
        style={{ height: visibleHeight }}
      >
        <div
          className="absolute left-0 right-0 top-0 h-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #0a0a10, transparent)' }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 h-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0a0a10, transparent)' }}
        />
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{
            top: centerOffset,
            height: ITEM_HEIGHT,
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
          }}
        />

        <motion.div
          className="absolute w-full px-2 pt-1"
          style={{ top: ITEM_TOTAL }}
          initial={{ y: 0 }}
          animate={{ y: spinning ? targetY : targetY }}
          transition={{ duration: SPIN_DURATION_MS / 1000, ease: [0.12, 0.8, 0.32, 1] }}
        >
          {strip.map((item, idx) => (
            <div key={`${item.id}-${idx}`} style={{ marginBottom: ITEM_GAP }}>
              <VerticalStripItem item={item} isCenter={idx === WIN_INDEX} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function DuelOpeningAnimation({
  allItems,
  playerItem,
  botItem,
  playerWon,
  tie,
  open,
  onClose,
  isBot = true,
}: DuelOpeningAnimationProps) {
  const [phase, setPhase] = useState<'spinning' | 'revealing' | 'done'>('spinning');
  const { scheduleTicksForAnimation, playReveal } = useDuelSounds();

  useEffect(() => {
    if (!open) return;
    setPhase('spinning');
    scheduleTicksForAnimation(SPIN_DURATION_MS);

    const t1 = setTimeout(() => {
      setPhase('revealing');
      playReveal(playerWon, tie);
    }, SPIN_DURATION_MS + 100);

    const t2 = setTimeout(() => setPhase('done'), SPIN_DURATION_MS + 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, playerWon, tie, scheduleTicksForAnimation, playReveal]);

  const playerColors = rarityColors[playerItem?.rarity as keyof typeof rarityColors] || rarityColors.common;
  const botColors = rarityColors[botItem?.rarity as keyof typeof rarityColors] || rarityColors.common;

  const resultLabel = playerWon ? 'You Won!' : tie ? "It's a Tie!" : `${isBot ? 'Bot' : 'Opponent'} Won`;
  const resultColor = playerWon ? '#22c55e' : tie ? '#f59e0b' : '#ef4444';

  return (
    <Dialog open={open} onOpenChange={phase === 'done' ? onClose : undefined}>
      <DialogContent className="max-w-md bg-[#0a0a10] border-white/10 p-0 overflow-hidden">
        <div className="relative min-h-[560px] flex flex-col">
          {phase === 'done' && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-50 text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          <div className="p-4 pb-0 border-b border-white/5">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Swords className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold text-white">1v1 Duel Opening</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-4 gap-4">
            {phase === 'spinning' && (
              <>
                <div className="flex gap-3">
                  <SpinColumn allItems={allItems} wonItem={playerItem} label="You" spinning />
                  <div className="flex items-center self-center">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <Swords className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <SpinColumn allItems={allItems} wonItem={botItem} label={isBot ? 'Bot' : 'Opponent'} spinning />
                </div>
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-center text-sm font-bold text-white"
                >
                  Opening Cases...
                </motion.p>
              </>
            )}

            {(phase === 'revealing' || phase === 'done') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="flex flex-col gap-5"
              >
                <div
                  className="text-center py-3 rounded-2xl border"
                  style={{
                    backgroundColor: `${resultColor}15`,
                    borderColor: `${resultColor}40`,
                    boxShadow: phase === 'done' ? `0 0 30px ${resultColor}30` : 'none',
                  }}
                >
                  {playerWon && <Crown className="w-6 h-6 mx-auto mb-1" style={{ color: resultColor }} />}
                  <p className="text-xl font-bold" style={{ color: resultColor }}>{resultLabel}</p>
                </div>

                <div className="flex gap-3">
                  <div className={cn('flex-1 flex flex-col gap-2 p-3 rounded-2xl border-2', playerWon ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/5')}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">You</p>
                    {playerWon && <p className="text-[10px] text-center font-bold text-green-400 uppercase">Winner</p>}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
                      style={{ backgroundColor: `${playerColors.bg}15`, border: `1.5px solid ${playerColors.border}60` }}
                    >
                      {playerItem?.item_type === 'coins' ? (
                        <Coins className="w-9 h-9 text-amber-400" />
                      ) : playerItem?.item_type === 'premium_key' ? (
                        <Key className="w-9 h-9 text-yellow-400" />
                      ) : (playerItem?.badge || playerItem?.global_badge)?.icon_url ? (
                        <BadgeImage
                          iconUrl={(playerItem?.badge || playerItem?.global_badge)?.icon_url || null}
                          name={(playerItem?.badge || playerItem?.global_badge)?.name || ''}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <ShieldCheck className="w-9 h-9" style={{ color: playerColors.bg }} />
                      )}
                    </div>
                    <p className="text-xs font-bold text-white text-center truncate">
                      {playerItem?.item_type === 'coins' ? `${playerItem.coin_amount} Coins`
                        : playerItem?.item_type === 'premium_key' ? 'Premium Key'
                        : (playerItem?.badge || playerItem?.global_badge)?.name || 'Badge'}
                    </p>
                    <p className="text-[10px] text-gray-500 text-center">{formatUC(playerItem?.display_value || 0)} UC</p>
                  </div>

                  <div className="flex items-center self-center">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <Swords className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className={cn('flex-1 flex flex-col gap-2 p-3 rounded-2xl border-2', !playerWon && !tie ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5')}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">{isBot ? 'Bot' : 'Opp.'}</p>
                    {!playerWon && !tie && <p className="text-[10px] text-center font-bold text-red-400 uppercase">Winner</p>}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
                      style={{ backgroundColor: `${botColors.bg}15`, border: `1.5px solid ${botColors.border}60` }}
                    >
                      {botItem?.item_type === 'coins' ? (
                        <Coins className="w-9 h-9 text-amber-400" />
                      ) : botItem?.item_type === 'premium_key' ? (
                        <Key className="w-9 h-9 text-yellow-400" />
                      ) : (botItem?.badge || botItem?.global_badge)?.icon_url ? (
                        <BadgeImage
                          iconUrl={(botItem?.badge || botItem?.global_badge)?.icon_url || null}
                          name={(botItem?.badge || botItem?.global_badge)?.name || ''}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <ShieldCheck className="w-9 h-9" style={{ color: botColors.bg }} />
                      )}
                    </div>
                    <p className="text-xs font-bold text-white text-center truncate">
                      {botItem?.item_type === 'coins' ? `${botItem.coin_amount} Coins`
                        : botItem?.item_type === 'premium_key' ? 'Premium Key'
                        : (botItem?.badge || botItem?.global_badge)?.name || 'Badge'}
                    </p>
                    <p className="text-[10px] text-gray-500 text-center">{formatUC(botItem?.display_value || 0)} UC</p>
                  </div>
                </div>

                {phase === 'done' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Button
                      onClick={onClose}
                      className="w-full font-bold"
                      style={{ background: `linear-gradient(135deg, ${resultColor}cc, ${resultColor})`, color: '#000', border: 'none' }}
                    >
                      {playerWon ? 'Collect Winnings' : tie ? 'Close' : 'Better Luck Next Time'}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
