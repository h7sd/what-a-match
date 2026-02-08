import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Sparkles, Coins, X, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOpenCase } from '@/hooks/useCases';
import { formatUC } from '@/lib/uc';
import { cn } from '@/lib/utils';

interface CaseOpeningDialogProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const rarityColors = {
  common: {
    bg: 'from-gray-500/20 to-gray-600/20',
    border: 'border-gray-500/50',
    glow: 'shadow-gray-500/50',
    text: 'text-gray-400',
  },
  rare: {
    bg: 'from-blue-500/20 to-blue-600/20',
    border: 'border-blue-500/50',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-400',
  },
  epic: {
    bg: 'from-purple-500/20 to-purple-600/20',
    border: 'border-purple-500/50',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-400',
  },
  legendary: {
    bg: 'from-amber-500/20 to-amber-600/20',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/50',
    text: 'text-amber-400',
  },
  premium: {
    bg: 'from-pink-500/20 via-purple-500/20 to-amber-500/20',
    border: 'border-pink-500/50',
    glow: 'shadow-pink-500/50',
    text: 'text-pink-400',
  },
};

type OpeningState = 'idle' | 'opening' | 'revealing' | 'complete';

export function CaseOpeningDialog({ caseId, open, onOpenChange }: CaseOpeningDialogProps) {
  const [state, setState] = useState<OpeningState>('idle');
  const [wonItem, setWonItem] = useState<any>(null);
  const openCaseMutation = useOpenCase();

  useEffect(() => {
    if (open) {
      setState('idle');
      setWonItem(null);
    }
  }, [open]);

  const handleOpen = async () => {
    setState('opening');

    setTimeout(() => {
      openCaseMutation.mutate(caseId, {
        onSuccess: (data) => {
          setWonItem(data.item);
          setTimeout(() => {
            setState('revealing');
            setTimeout(() => {
              setState('complete');
            }, 500);
          }, 1500);
        },
        onError: () => {
          setState('idle');
        },
      });
    }, 500);
  };

  const handleClose = () => {
    setState('idle');
    setWonItem(null);
    onOpenChange(false);
  };

  const rarity = wonItem?.rarity || 'common';
  const colors = rarityColors[rarity as keyof typeof rarityColors];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="relative min-h-[500px] flex flex-col">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Idle State - Ready to Open */}
          {state === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
                  <Package className="relative w-32 h-32 text-amber-500" />
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold mb-4">Ready to Open?</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Click the button below to open your case and reveal your prize!
              </p>

              <Button
                onClick={handleOpen}
                size="lg"
                className="gap-2 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                disabled={openCaseMutation.isPending}
              >
                <Sparkles className="w-5 h-5" />
                {openCaseMutation.isPending ? 'Opening...' : 'Open Case'}
              </Button>
            </motion.div>
          )}

          {/* Opening Animation */}
          {state === 'opening' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 0.9, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Package className="w-32 h-32 text-amber-500" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-semibold mt-8 text-muted-foreground"
              >
                Opening case...
              </motion.p>

              {/* Loading Dots */}
              <div className="flex gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-amber-500"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Revealing & Complete States */}
          {(state === 'revealing' || state === 'complete') && wonItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden"
            >
              {/* Background Glow Effect */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 2 }}
                transition={{ duration: 1 }}
                className={cn(
                  'absolute inset-0 blur-3xl',
                  `bg-gradient-to-br ${colors.bg}`
                )}
              />

              {/* Confetti/Particles for Rare Items */}
              {(rarity === 'legendary' || rarity === 'premium') && (
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                        opacity: 1,
                      }}
                      animate={{
                        x: `${Math.random() * 100}%`,
                        y: `${Math.random() * 100}%`,
                        scale: Math.random() * 2 + 1,
                        opacity: 0,
                      }}
                      transition={{
                        duration: Math.random() * 2 + 1,
                        ease: "easeOut",
                      }}
                      className={cn(
                        'absolute w-2 h-2 rounded-full',
                        rarity === 'premium' ? 'bg-pink-400' : 'bg-amber-400'
                      )}
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Item Display */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative z-10"
              >
                <div
                  className={cn(
                    'relative p-12 rounded-3xl border-2 backdrop-blur-sm shadow-2xl',
                    `bg-gradient-to-br ${colors.bg}`,
                    colors.border,
                    state === 'complete' && `shadow-[0_0_50px] ${colors.glow}`
                  )}
                >
                  {wonItem.item_type === 'badge' && wonItem.badge?.icon_url ? (
                    <img
                      src={wonItem.badge.icon_url}
                      alt={wonItem.badge.name}
                      className="w-32 h-32 object-contain"
                    />
                  ) : wonItem.item_type === 'coins' ? (
                    <Coins className="w-32 h-32 text-amber-500" />
                  ) : (
                    <Sparkles className="w-32 h-32 text-primary" />
                  )}

                  {/* Rarity Badge */}
                  <Badge
                    className={cn(
                      'absolute -top-3 left-1/2 -translate-x-1/2 uppercase font-bold',
                      colors.text
                    )}
                  >
                    {rarity}
                  </Badge>
                </div>
              </motion.div>

              {/* Item Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mt-8 relative z-10"
              >
                <h3 className="text-3xl font-bold mb-2">
                  {wonItem.item_type === 'badge'
                    ? wonItem.badge?.name || 'Badge'
                    : `${wonItem.coin_amount} Coins`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Value: {formatUC(wonItem.display_value)} UC
                </p>

                {state === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={handleClose}
                      size="lg"
                      className="gap-2 mt-4"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Awesome!
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
