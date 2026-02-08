import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Coins, Sparkles, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatUC } from '@/lib/uc';
import { cn } from '@/lib/utils';

interface CaseItem {
  id: string;
  item_type: 'badge' | 'coins';
  badge_id: string | null;
  coin_amount: number | null;
  rarity: string;
  display_value: number;
  badge?: {
    name: string;
    icon_url: string;
    color: string;
  };
}

interface CaseOpeningAnimationProps {
  caseId: string;
  allItems: CaseItem[];
  wonItem: CaseItem;
  open: boolean;
  onClose: () => void;
}

const rarityColors = {
  common: { bg: '#B0C3D9', border: '#B0C3D9', glow: 'rgba(176, 195, 217, 0.5)' },
  rare: { bg: '#5E98D9', border: '#5E98D9', glow: 'rgba(94, 152, 217, 0.5)' },
  epic: { bg: '#8B5CF6', border: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.5)' },
  legendary: { bg: '#EB4B4B', border: '#EB4B4B', glow: 'rgba(235, 75, 75, 0.5)' },
  premium: { bg: '#FFD700', border: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)' },
};

function generateItemStrip(allItems: CaseItem[], wonItem: CaseItem): CaseItem[] {
  const strip: CaseItem[] = [];
  const winningIndex = 50;

  for (let i = 0; i < 100; i++) {
    if (i === winningIndex) {
      strip.push(wonItem);
    } else {
      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
      strip.push({ ...randomItem, id: `${randomItem.id}-${i}` });
    }
  }

  return strip;
}

export function CaseOpeningAnimation({
  allItems,
  wonItem,
  open,
  onClose,
}: CaseOpeningAnimationProps) {
  const [state, setState] = useState<'spinning' | 'revealing' | 'complete'>('spinning');
  const [itemStrip, setItemStrip] = useState<CaseItem[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setState('spinning');
      const strip = generateItemStrip(allItems, wonItem);
      setItemStrip(strip);

      setTimeout(() => {
        setState('revealing');
        setTimeout(() => {
          setState('complete');
        }, 1000);
      }, 6000);
    }
  }, [open, allItems, wonItem]);

  const rarity = wonItem?.rarity || 'common';
  const colors = rarityColors[rarity as keyof typeof rarityColors];
  const itemWidth = 150;
  const winningPosition = 50;
  const targetOffset = -(winningPosition * itemWidth) + (typeof window !== 'undefined' ? window.innerWidth / 2 : 400) - (itemWidth / 2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-black/95">
        <div className="relative min-h-[600px] flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            {state === 'spinning' && (
              <>
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-500 z-20 shadow-[0_0_20px_rgba(251,191,36,0.8)]" />

                <div className="w-full overflow-hidden relative h-[200px]">
                  <motion.div
                    ref={stripRef}
                    className="flex absolute"
                    initial={{ x: 100 }}
                    animate={{ x: targetOffset }}
                    transition={{
                      duration: 6,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    {itemStrip.map((item, index) => {
                      const itemColors = rarityColors[item.rarity as keyof typeof rarityColors];
                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex-shrink-0 mx-2 transition-all"
                          style={{ width: itemWidth }}
                        >
                          <div
                            className="h-[180px] rounded-lg border-2 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
                            style={{
                              backgroundColor: `${itemColors.bg}20`,
                              borderColor: itemColors.border,
                            }}
                          >
                            {item.item_type === 'coins' ? (
                              <>
                                <Coins className="w-16 h-16 text-amber-500 mb-2" />
                                <p className="text-sm font-bold text-white text-center">
                                  {item.coin_amount} Coins
                                </p>
                              </>
                            ) : item.badge?.icon_url ? (
                              <>
                                <img
                                  src={item.badge.icon_url}
                                  alt={item.badge.name}
                                  className="w-16 h-16 object-contain mb-2"
                                />
                                <p className="text-xs font-medium text-white text-center line-clamp-2">
                                  {item.badge.name}
                                </p>
                              </>
                            ) : (
                              <Sparkles className="w-16 h-16 text-primary" />
                            )}
                            <Badge
                              className="mt-2 text-[10px]"
                              style={{
                                backgroundColor: itemColors.bg,
                                color: 'white',
                              }}
                            >
                              {item.rarity}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                <div className="mt-8 text-center">
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl font-bold text-white"
                  >
                    Opening Case...
                  </motion.p>
                </div>
              </>
            )}

            {(state === 'revealing' || state === 'complete') && wonItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 relative"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.3, scale: 2 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 blur-3xl rounded-full"
                  style={{ backgroundColor: colors.glow }}
                />

                {(rarity === 'legendary' || rarity === 'premium') && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: '50%', y: '50%', scale: 0, opacity: 1 }}
                        animate={{
                          x: `${50 + (Math.random() - 0.5) * 100}%`,
                          y: `${50 + (Math.random() - 0.5) * 100}%`,
                          scale: Math.random() * 2 + 1,
                          opacity: 0,
                        }}
                        transition={{
                          duration: Math.random() * 2 + 1,
                          ease: "easeOut",
                        }}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: rarity === 'premium' ? '#FFD700' : '#EB4B4B',
                          left: '50%',
                          top: '50%',
                        }}
                      />
                    ))}
                  </div>
                )}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative z-10"
                >
                  <div
                    className="relative p-16 rounded-3xl border-4 backdrop-blur-sm"
                    style={{
                      backgroundColor: `${colors.bg}30`,
                      borderColor: colors.border,
                      boxShadow: `0 0 50px ${colors.glow}`,
                    }}
                  >
                    {wonItem.item_type === 'badge' && wonItem.badge?.icon_url ? (
                      <img
                        src={wonItem.badge.icon_url}
                        alt={wonItem.badge.name}
                        className="w-40 h-40 object-contain"
                      />
                    ) : wonItem.item_type === 'coins' ? (
                      <Coins className="w-40 h-40 text-amber-500" />
                    ) : (
                      <Sparkles className="w-40 h-40 text-primary" />
                    )}

                    <Badge
                      className="absolute -top-4 left-1/2 -translate-x-1/2 uppercase font-bold text-sm px-4 py-1"
                      style={{
                        backgroundColor: colors.bg,
                        color: 'white',
                      }}
                    >
                      {rarity}
                    </Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mt-8 relative z-10"
                >
                  <h3 className="text-4xl font-bold mb-3 text-white">
                    {wonItem.item_type === 'badge'
                      ? wonItem.badge?.name || 'Badge'
                      : `${wonItem.coin_amount} Coins`}
                  </h3>
                  <p className="text-xl text-gray-300 mb-6">
                    Value: {formatUC(wonItem.display_value)} UC
                  </p>

                  {state === 'complete' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={onClose}
                        size="lg"
                        className="gap-2 mt-4 text-lg px-8 py-6"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Awesome!
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
