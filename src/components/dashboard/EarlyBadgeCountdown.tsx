import { useState, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Loader2, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useClaimBadge, useUserBadges, useGlobalBadges } from '@/hooks/useBadges';
import { useToast } from '@/hooks/use-toast';

// Lazy load Aurora for performance
const Aurora = lazy(() => import('@/components/ui/Aurora'));

export function EarlyBadgeCountdown() {
  const { user } = useAuth();
  const { data: userBadges = [] } = useUserBadges(user?.id || '');
  const { data: globalBadges = [] } = useGlobalBadges();
  const claimBadge = useClaimBadge();
  const { toast } = useToast();
  
  const [isClaiming, setIsClaiming] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Find the EARLY badge
  const earlyBadge = globalBadges.find(b => b.name.toLowerCase() === 'early');
  const hasEarlyBadge = userBadges.some(ub => ub.badge_id === earlyBadge?.id);
  
  const maxClaims = earlyBadge?.max_claims ?? 100;
  const claimedCount = earlyBadge?.claims_count ?? 0;
  const remainingClaims = Math.max(0, maxClaims - claimedCount);
  const isSoldOut = remainingClaims === 0;

  const handleClaim = async () => {
    if (!earlyBadge || hasEarlyBadge || isSoldOut) return;

    setIsClaiming(true);
    try {
      await claimBadge.mutateAsync(earlyBadge.id);
      toast({ title: 'EARLY badge claimed!', description: 'Welcome to the early supporters club!' });
    } catch (error: any) {
      toast({ title: error.message || 'Failed to claim badge', variant: 'destructive' });
    } finally {
      setIsClaiming(false);
    }
  };

  // Don't show if no EARLY badge exists
  if (!earlyBadge) return null;

  // Don't show if user already has the badge
  if (hasEarlyBadge) {
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="group relative overflow-hidden rounded-2xl border border-[#00D9A5]/20 bg-black/40 backdrop-blur-xl p-6"
      >
        {/* Aurora background effect */}
        <Suspense fallback={null}>
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
            <Aurora
              colorStops={['#00B4D8', '#00D9A5', '#0077B6']}
              amplitude={0.7}
              blend={0.6}
              speed={0.5}
            />
          </div>
        </Suspense>
        
        <div className="relative z-10 flex items-center gap-4">
          <motion.div 
            className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00D9A5]/30 to-[#00B4D8]/20 flex items-center justify-center border border-[#00D9A5]/30"
            animate={{ 
              boxShadow: ['0 0 20px rgba(0, 217, 165, 0.3)', '0 0 40px rgba(0, 217, 165, 0.5)', '0 0 20px rgba(0, 217, 165, 0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-7 h-7 text-[#00D9A5]" />
          </motion.div>
          <div>
            <h3 className="font-bold text-[#00D9A5] text-lg">EARLY Badge Claimed!</h3>
            <p className="text-sm text-white/50">You're an early supporter 🎉</p>
          </div>
        </div>
        
        {/* Sparkle decorations */}
        <motion.div
          className="absolute top-4 right-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-5 h-5 text-[#00D9A5]/40" />
        </motion.div>
      </motion.div>
    );
  }

  // Show sold out state
  if (isSoldOut) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 backdrop-blur-xl p-6"
      >
        {/* Aurora background effect */}
        <Suspense fallback={null}>
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
            <Aurora
              colorStops={['#00B4D8', '#00D9A5', '#0077B6']}
              amplitude={0.5}
              blend={0.6}
              speed={0.3}
            />
          </div>
        </Suspense>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <Clock className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-red-400 text-lg">EARLY Badge Sold Out</h3>
            <p className="text-sm text-white/50">All {maxClaims} badges have been claimed</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-[#00D9A5]/20 bg-black/40 backdrop-blur-xl p-6 space-y-5"
    >
      {/* Aurora background effect */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <Aurora
            colorStops={['#00B4D8', '#00D9A5', '#0077B6']}
            amplitude={0.7}
            blend={0.6}
            speed={0.5}
          />
        </div>
      </Suspense>
      
      <div className="relative z-10 flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-5 h-5 text-[#00D9A5]" />
        </motion.div>
        <h3 className="font-bold text-[#00D9A5]">Claim EARLY Badge</h3>
      </div>

      <p className="relative z-10 text-sm text-white/50">
        Be an early supporter! Only {maxClaims} badges available.
      </p>

      {/* Claims Progress */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="bg-black/40 rounded-xl p-4 border border-[#00D9A5]/20 backdrop-blur">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-[#00D9A5]" />
              <span className="text-3xl font-bold text-[#00D9A5]">
                {claimedCount}
              </span>
            </div>
          </div>
          <span className="text-xs text-white/40 mt-2 block">Claimed</span>
        </motion.div>
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="bg-black/40 rounded-xl p-4 border border-[#00B4D8]/20 backdrop-blur">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-[#00B4D8]" />
              <span className="text-3xl font-bold text-[#00B4D8]">
                {remainingClaims}
              </span>
            </div>
          </div>
          <span className="text-xs text-white/40 mt-2 block">Remaining</span>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-full bg-black/40 rounded-full h-2 border border-[#00D9A5]/20 overflow-hidden">
        <motion.div 
          className="h-full rounded-full bg-gradient-to-r from-[#00B4D8] via-[#00D9A5] to-[#0077B6]"
          style={{ 
            width: `${(claimedCount / maxClaims) * 100}%`,
            backgroundSize: '200% 100%'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <motion.div 
        className="relative z-10"
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleClaim}
          disabled={isClaiming}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#00B4D8] via-[#00D9A5] to-[#0077B6] hover:opacity-90 font-semibold shadow-lg shadow-[#00D9A5]/20"
          style={{ backgroundSize: '200% 100%' }}
        >
          {isClaiming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Claim Now
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
