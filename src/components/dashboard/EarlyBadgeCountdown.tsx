import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useClaimBadge, useUserBadges, useGlobalBadges } from '@/hooks/useBadges';
import { useToast } from '@/hooks/use-toast';

export function EarlyBadgeCountdown() {
  const { user } = useAuth();
  const { data: userBadges = [] } = useUserBadges(user?.id || '');
  const { data: globalBadges = [] } = useGlobalBadges();
  const claimBadge = useClaimBadge();
  const { toast } = useToast();
  
  const [isClaiming, setIsClaiming] = useState(false);

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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border border-green-500/30 bg-green-500/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-green-400">EARLY Badge Claimed!</h3>
            <p className="text-sm text-muted-foreground">You're an early supporter 🎉</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show sold out state
  if (isSoldOut) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border border-red-500/30 bg-red-500/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-red-400">EARLY Badge Sold Out</h3>
            <p className="text-sm text-muted-foreground">All {maxClaims} badges have been claimed</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-4 border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5"
    >
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-yellow-400">Claim EARLY Badge</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Be an early supporter! Only {maxClaims} badges available.
      </p>

      {/* Claims Progress */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="bg-black/40 rounded-lg p-3 border border-yellow-500/20">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                {claimedCount}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Claimed</span>
        </div>
        <div className="text-center">
          <div className="bg-black/40 rounded-lg p-3 border border-green-500/20">
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-2xl sm:text-3xl font-bold text-green-400">
                {remainingClaims}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">Remaining</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-black/40 rounded-full h-2 border border-yellow-500/20">
        <div 
          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${(claimedCount / maxClaims) * 100}%` }}
        />
      </div>

      <Button
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-500 hover:to-orange-400"
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
  );
}
