import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';
import { useStreak, STREAK_MILESTONES, getNextMilestone, getCurrentMilestone } from '@/hooks/useStreak';
import { Progress } from '@/components/ui/progress';
import { AnimatedFlame } from './AnimatedFlame';

export function StreakDisplay() {
  const { streak, isLoading, streakUpdated } = useStreak();

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card/50 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
        <div className="h-10 bg-muted rounded w-1/2" />
      </div>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const totalLogins = streak?.total_logins || 0;
  
  const currentMilestone = getCurrentMilestone(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);
  
  const progressToNext = nextMilestone 
    ? Math.min(100, (currentStreak / nextMilestone.days) * 100)
    : 100;

  return (
    <div className="space-y-3">
      {/* Main Streak Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4"
      >
        {/* Streak Updated Animation */}
        <AnimatePresence>
          {streakUpdated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30"
            >
              +1 Day! 🎉
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          {/* Animated Flame */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30 overflow-hidden">
              <AnimatedFlame size="md" isActive={currentStreak > 0} />
            </div>
            {currentMilestone && (
              <div 
                className="absolute -bottom-1 -right-1 text-lg"
                title={currentMilestone.label}
              >
                {currentMilestone.icon}
              </div>
            )}
          </div>

          {/* Streak Info */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">{currentStreak}</span>
              <span className="text-lg text-muted-foreground">days</span>
            </div>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {nextMilestone && currentStreak < nextMilestone.days && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Next: {nextMilestone.label}</span>
              <span className="text-primary font-medium">
                {nextMilestone.days - currentStreak} days left
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Best</span>
          </div>
          <p className="text-lg font-bold text-white">
            {longestStreak} <span className="text-xs font-normal text-white/40">days</span>
          </p>
        </div>

        <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-lg font-bold text-white">{totalLogins}</p>
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Milestones</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {STREAK_MILESTONES.map((milestone) => {
            const isAchieved = currentStreak >= milestone.days;
            return (
              <div
                key={milestone.days}
                className={`
                  px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-colors
                  ${isAchieved
                    ? 'bg-primary/20 border border-primary/30 text-primary'
                    : 'bg-white/[0.02] border border-white/[0.04] text-white/20'
                  }
                `}
                title={milestone.label}
              >
                <span className="text-sm">{milestone.icon}</span>
                <span className="text-[9px] font-medium">{milestone.days}d</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
