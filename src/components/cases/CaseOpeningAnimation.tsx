import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, Key, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatUC } from '@/lib/uc';
import { CaseItem } from '@/hooks/useCases';

interface CaseOpeningAnimationProps {
  caseId: string;
  allItems: CaseItem[];
  wonItem: CaseItem;
  open: boolean;
  onClose: () => void;
}

const rarityColors = {
  common:    { bg: '#b0c3d9', border: '#b0c3d9', glow: 'rgba(176,195,217,0.5)' },
  uncommon:  { bg: '#4ade80', border: '#4ade80', glow: 'rgba(74,222,128,0.5)' },
  rare:      { bg: '#5e98d9', border: '#5e98d9', glow: 'rgba(94,152,217,0.5)' },
  epic:      { bg: '#a855f7', border: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
  legendary: { bg: '#eb4b4b', border: '#eb4b4b', glow: 'rgba(235,75,75,0.5)' },
  premium:   { bg: '#ffd700', border: '#ffd700', glow: 'rgba(255,215,0,0.9)' },
};

function isSvgString(str: string | null): boolean {
  return !!str && str.trim().startsWith('<svg');
}

function BadgeImage({ iconUrl, name, className, style }: { iconUrl: string | null; name: string; className?: string; style?: React.CSSProperties }) {
  if (!iconUrl) return null;
  if (isSvgString(iconUrl)) {
    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: iconUrl }}
      />
    );
  }
  return <img src={iconUrl} alt={name} className={className} style={style} />;
}

function getItemDisplay(item: CaseItem) {
  const badge = item.badge || item.global_badge;
  if (item.item_type === 'premium_key') return { name: 'Premium Key', icon: null, isPremiumKey: true, isCoins: false, isBadge: false };
  if (item.item_type === 'coins') return { name: `${item.coin_amount} Coins`, icon: null, isPremiumKey: false, isCoins: true, isBadge: false };
  return { name: badge?.name || 'Badge', icon: badge?.icon_url || null, isPremiumKey: false, isCoins: false, isBadge: true };
}

function generateStrip(allItems: CaseItem[], wonItem: CaseItem): CaseItem[] {
  const strip: CaseItem[] = [];
  const winIndex = 50;
  const fallbackItem: CaseItem = { ...wonItem, id: `${wonItem.id}-fallback` };
  const pool = allItems.length > 0 ? allItems : [fallbackItem];
  for (let i = 0; i < 100; i++) {
    if (i === winIndex) {
      strip.push(wonItem);
    } else {
      const r = pool[Math.floor(Math.random() * pool.length)];
      strip.push({ ...r, id: `${r.id}-${i}` });
    }
  }
  return strip;
}

function useCaseSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playTick = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [getCtx]);

  const playReveal = useCallback((rarity: string) => {
    try {
      const ctx = getCtx();
      const freqs = rarity === 'premium' ? [523, 659, 784, 1047] :
                    rarity === 'legendary' ? [440, 554, 659, 880] :
                    rarity === 'epic' ? [370, 466, 587, 740] :
                    rarity === 'rare' ? [330, 415, 494, 622] :
                    [262, 330, 392, 523];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.6);
      });
    } catch {}
  }, [getCtx]);

  return { playTick, playReveal };
}

function StripItem({ item }: { item: CaseItem }) {
  const display = getItemDisplay(item);
  const colors = rarityColors[item.rarity as keyof typeof rarityColors] || rarityColors.common;
  return (
    <div
      className="flex-shrink-0 mx-1.5 w-[130px] h-[160px] rounded-xl flex flex-col items-center justify-center gap-2 border-2"
      style={{ backgroundColor: `${colors.bg}15`, borderColor: `${colors.border}60` }}
    >
      <div className="w-14 h-14 flex items-center justify-center">
        {display.isPremiumKey ? (
          <Key className="w-10 h-10" style={{ color: colors.bg }} />
        ) : display.isCoins ? (
          <Coins className="w-10 h-10 text-amber-400" />
        ) : display.icon ? (
          <BadgeImage iconUrl={display.icon} name={display.name} className="w-12 h-12 object-contain" />
        ) : (
          <ShieldCheck className="w-10 h-10" style={{ color: colors.bg }} />
        )}
      </div>
      <p className="text-xs font-medium text-white text-center px-2 line-clamp-2 leading-tight">{display.name}</p>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.bg}30`, color: colors.bg }}>
        {item.rarity.toUpperCase()}
      </span>
    </div>
  );
}

export function CaseOpeningAnimation({ allItems, wonItem, open, onClose }: CaseOpeningAnimationProps) {
  const [state, setState] = useState<'spinning' | 'revealing' | 'complete'>('spinning');
  const [itemStrip, setItemStrip] = useState<CaseItem[]>([]);
  const { playTick, playReveal } = useCaseSounds();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setState('spinning');
      setItemStrip(generateStrip(allItems, wonItem));

      let tickDelay = 60;
      let tickCount = 0;
      const totalTicks = 55;

      const scheduleTick = () => {
        if (tickCount >= totalTicks) return;
        tickIntervalRef.current = setTimeout(() => {
          playTick();
          tickCount++;
          const progress = tickCount / totalTicks;
          tickDelay = 60 + progress * progress * 400;
          scheduleTick();
        }, tickDelay);
      };
      scheduleTick();

      const t1 = setTimeout(() => {
        setState('revealing');
        playReveal(wonItem.rarity);
      }, 5500);
      const t2 = setTimeout(() => setState('complete'), 6500);

      return () => {
        if (tickIntervalRef.current) clearTimeout(tickIntervalRef.current);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [open, allItems, wonItem, playTick, playReveal]);

  const rarity = wonItem?.rarity || 'common';
  const colors = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  const display = getItemDisplay(wonItem);

  const itemWidth = 147;
  const winIndex = 50;
  const targetX = -(winIndex * itemWidth) + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) - itemWidth / 2;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[96vw] max-h-[92vh] p-0 overflow-hidden bg-[#0a0a10] border-white/10">
        <div className="relative min-h-[560px] flex flex-col">
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-50 text-gray-400 hover:text-white" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">

            {state === 'spinning' && (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full overflow-hidden" style={{ height: 180 }}>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 z-20 -translate-x-1/2" style={{ background: colors.bg, boxShadow: `0 0 12px ${colors.glow}` }} />
                  <div className="absolute left-0 right-0 top-0 h-8 z-10" style={{ background: 'linear-gradient(to bottom, #0a0a10, transparent)' }} />
                  <div className="absolute left-0 right-0 bottom-0 h-8 z-10" style={{ background: 'linear-gradient(to top, #0a0a10, transparent)' }} />

                  <motion.div
                    className="flex absolute top-[10px]"
                    initial={{ x: 100 }}
                    animate={{ x: targetX }}
                    transition={{ duration: 5.5, ease: [0.12, 0.8, 0.32, 1] }}
                  >
                    {itemStrip.map((item, idx) => (
                      <StripItem key={`${item.id}-${idx}`} item={item} />
                    ))}
                  </motion.div>
                </div>

                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="mt-10 text-xl font-bold text-white tracking-wide"
                >
                  Opening Case...
                </motion.p>
              </div>
            )}

            {(state === 'revealing' || state === 'complete') && wonItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                className="flex flex-col items-center justify-center px-8 py-12 relative"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.35, scale: 2.5 }}
                  transition={{ duration: 1.2 }}
                  className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
                  style={{ backgroundColor: colors.glow }}
                />

                {(rarity === 'legendary' || rarity === 'premium') && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: rarity === 'premium' ? 60 : 35 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full"
                        initial={{ x: '50%', y: '50%', scale: 0, opacity: 1 }}
                        animate={{
                          x: `${50 + (Math.random() - 0.5) * 120}%`,
                          y: `${50 + (Math.random() - 0.5) * 120}%`,
                          scale: Math.random() * 2.5 + 0.5,
                          opacity: 0,
                        }}
                        transition={{ duration: Math.random() * 2 + 0.8, ease: 'easeOut', delay: Math.random() * 0.3 }}
                        style={{
                          width: Math.random() * 8 + 4,
                          height: Math.random() * 8 + 4,
                          backgroundColor: colors.bg,
                          left: '50%',
                          top: '50%',
                        }}
                      />
                    ))}
                  </div>
                )}

                <motion.div
                  className="relative z-10 rounded-3xl border-2 p-10 flex items-center justify-center"
                  style={{
                    backgroundColor: `${colors.bg}12`,
                    borderColor: colors.border,
                    boxShadow: state === 'complete' ? `0 0 60px ${colors.glow}, 0 0 120px ${colors.glow}40` : 'none',
                  }}
                  animate={state === 'complete' ? { boxShadow: [`0 0 40px ${colors.glow}`, `0 0 80px ${colors.glow}`, `0 0 40px ${colors.glow}`] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                    style={{ backgroundColor: colors.bg, color: rarity === 'premium' ? '#000' : '#fff' }}
                  >
                    {rarity === 'premium' ? '★ PREMIUM KEY ★' : rarity}
                  </div>

                  {display.isPremiumKey ? (
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Key className="w-32 h-32" style={{ color: colors.bg, filter: `drop-shadow(0 0 20px ${colors.glow})` }} />
                    </motion.div>
                  ) : display.isCoins ? (
                    <Coins className="w-32 h-32 text-amber-400" style={{ filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.6))' }} />
                  ) : display.icon ? (
                    <BadgeImage
                      iconUrl={display.icon}
                      name={display.name}
                      className="w-32 h-32 object-contain"
                      style={{ filter: `drop-shadow(0 0 16px ${colors.glow})` }}
                    />
                  ) : (
                    <ShieldCheck className="w-32 h-32" style={{ color: colors.bg, filter: `drop-shadow(0 0 16px ${colors.glow})` }} />
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-center mt-8 relative z-10"
                >
                  <h3 className="text-3xl font-bold text-white mb-1">{display.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    {display.isPremiumKey
                      ? 'An unbelievably rare key. Redeemable for Premium.'
                      : `Estimated value: ${formatUC(wonItem.display_value)} coins`}
                  </p>

                  {state === 'complete' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      <Button onClick={onClose} size="lg" className="gap-2 px-8 font-semibold"
                        style={{ background: `linear-gradient(135deg, ${colors.bg}cc, ${colors.bg})`, color: rarity === 'premium' ? '#000' : '#fff', border: 'none' }}>
                        <CheckCircle2 className="w-5 h-5" />
                        Collect
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
