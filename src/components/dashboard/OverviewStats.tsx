import { Eye, Hash, ThumbsUp, ThumbsDown, MessageCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OverviewStatsProps {
  profileViews: number;
  uidNumber: number;
  username: string;
  profileId?: string;
}

function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startValue + diff * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{displayValue.toLocaleString()}</>;
}

interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  index: number;
  isNumber?: boolean;
  color?: 'primary' | 'blue' | 'amber' | 'emerald' | 'rose';
}

function StatCard({
  icon: Icon,
  value,
  label,
  index,
  isNumber = true,
  color = 'primary'
}: StatCardProps) {
  const colorStyles = {
    primary: {
      iconBg: 'from-[#00B4D8]/20 via-[#00D9A5]/15 to-[#0077B6]/20',
      iconBorder: 'border-[#00D9A5]/30 group-hover:border-[#00D9A5]/50',
      iconColor: 'text-[#00D9A5]',
      glow: 'shadow-[#00D9A5]/20',
    },
    blue: {
      iconBg: 'from-[#00B4D8]/20 to-[#0077B6]/20',
      iconBorder: 'border-[#00B4D8]/30 group-hover:border-[#00B4D8]/50',
      iconColor: 'text-[#00B4D8]',
      glow: 'shadow-[#00B4D8]/20',
    },
    amber: {
      iconBg: 'from-amber-500/20 to-amber-500/5',
      iconBorder: 'border-amber-500/30 group-hover:border-amber-500/50',
      iconColor: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
    emerald: {
      iconBg: 'from-[#00D9A5]/20 to-[#00D9A5]/5',
      iconBorder: 'border-[#00D9A5]/30 group-hover:border-[#00D9A5]/50',
      iconColor: 'text-[#00D9A5]',
      glow: 'shadow-[#00D9A5]/20',
    },
    rose: {
      iconBg: 'from-rose-500/20 to-rose-500/5',
      iconBorder: 'border-rose-500/30 group-hover:border-rose-500/50',
      iconColor: 'text-rose-400',
      glow: 'shadow-rose-500/20',
    }
  };

  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.5,
        type: "spring",
        stiffness: 120,
        damping: 15
      }}
      whileHover={{
        y: -6,
        scale: 1.01,
        transition: { duration: 0.3, type: "spring", stiffness: 400, damping: 10 }
      }}
      className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-black/50 via-black/30 to-black/50 backdrop-blur-xl p-5 cursor-pointer"
    >
      {/* Animated gradient background */}
      <motion.div
        className={`absolute inset-0 opacity-0 group-hover:opacity-25 transition-all duration-700 bg-gradient-to-br ${styles.iconBg}`}
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        <motion.div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${styles.iconBg} flex items-center justify-center border ${styles.iconBorder} transition-all duration-300 shadow-lg ${styles.glow}`}
          whileHover={{
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.3 }
          }}
        >
          <Icon className={`w-6 h-6 ${styles.iconColor} transition-transform group-hover:scale-110`} />
        </motion.div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide">{label}</p>
          <motion.p
            className="text-2xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {isNumber && typeof value === 'number' ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </motion.p>
        </div>
      </div>

      {/* Bottom glow */}
      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r ${styles.iconBg} opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500`} />
    </motion.div>
  );
}

export function OverviewStats({ profileViews, uidNumber, username, profileId }: OverviewStatsProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [linkClicks, setLinkClicks] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profileId) return;

      try {
        // Fetch likes/dislikes from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('likes_count, dislikes_count')
          .eq('id', profileId)
          .single();

        if (profileData) {
          setLikesCount(profileData.likes_count || 0);
          setDislikesCount(profileData.dislikes_count || 0);
        }

        // Fetch comments count
        const { data: commentsData } = await supabase.functions.invoke('profile-comment', {
          body: { action: 'get_count' }
        });
        if (commentsData?.count !== undefined) {
          setCommentsCount(commentsData.count);
        }

        // Fetch link clicks
        const { data: linksData } = await supabase
          .from('social_links')
          .select('click_count')
          .eq('profile_id', profileId);

        if (linksData) {
          const totalClicks = linksData.reduce((sum, link) => sum + (link.click_count || 0), 0);
          setLinkClicks(totalClicks);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };

    fetchStats();
  }, [profileId]);

  return (
    <div className="space-y-6">
      {/* Primary Stats - Most Important */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Eye}
          value={profileViews}
          label="Profile Views"
          index={0}
          color="primary"
        />
        <StatCard
          icon={Hash}
          value={`#${uidNumber}`}
          label="User ID"
          index={1}
          isNumber={false}
          color="blue"
        />
      </div>

      {/* Engagement Stats */}
      <div className="relative">
        <div className="absolute -top-3 left-4 px-3 py-1 bg-black/80 backdrop-blur-sm border border-white/[0.08] rounded-full">
          <span className="text-xs font-medium text-white/60">Engagement</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <StatCard
            icon={ThumbsUp}
            value={likesCount}
            label="Likes"
            index={2}
            color="emerald"
          />
          <StatCard
            icon={ThumbsDown}
            value={dislikesCount}
            label="Dislikes"
            index={3}
            color="rose"
          />
          <StatCard
            icon={MessageCircle}
            value={commentsCount}
            label="Comments"
            index={4}
            color="amber"
          />
          <StatCard
            icon={TrendingUp}
            value={linkClicks}
            label="Link Clicks"
            index={5}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}
