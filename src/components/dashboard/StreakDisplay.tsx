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
    <div className="space-y-4 h-full">
      {/* Main Streak Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-black/40 to-black/60 backdrop-blur-xl p-6 shadow-xl"
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
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          className="group p-5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.3 } }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium">Longest Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {longestStreak} <span className="text-sm font-normal text-white/50">days</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          className="group p-5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.3 } }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/50 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Total Logins</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalLogins}</p>
          </div>
        </motion.div>
      </div>

      {/* Milestone Badges */}
      <motion.div
        className="p-5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white">Milestones</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STREAK_MILESTONES.map((milestone, idx) => {
            const isAchieved = currentStreak >= milestone.days;
            return (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + idx * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.1, y: -2 }}
                className={`
                  px-3 py-2 rounded-full text-sm flex items-center gap-2 transition-all cursor-default
                  ${isAchieved
                    ? 'bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/40 text-primary shadow-lg shadow-primary/20'
                    : 'bg-white/[0.03] border border-white/[0.06] text-white/30'
                  }
                `}
                title={milestone.label}
              >
                <span className="text-base">{milestone.icon}</span>
                <span className="text-xs font-medium">{milestone.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
