// FIXED: Added Crown icon for premium button
import { Eye, Hash, ThumbsUp, ThumbsDown, MessageCircle, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// FIXED: Added hasPremium prop to check premium status
interface OverviewStatsProps {
  profileViews: number;
  uidNumber: number;
  username: string;
  profileId?: string;
  hasPremium?: boolean;
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
  color?: 'primary' | 'blue' | 'amber' | 'red' | 'rose';
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
      iconBg: 'from-red-600/20 via-red-800/15 to-red-900/20',
      iconBorder: 'border-red-800/30 group-hover:border-red-800/50',
      iconColor: 'text-red-800',
      glow: 'shadow-red-800/20',
    },
    blue: {
      iconBg: 'from-red-600/20 to-red-900/20',
      iconBorder: 'border-red-600/30 group-hover:border-red-600/50',
      iconColor: 'text-red-600',
      glow: 'shadow-red-600/20',
    },
    amber: {
      iconBg: 'from-amber-500/20 to-amber-500/5',
      iconBorder: 'border-amber-500/30 group-hover:border-amber-500/50',
      iconColor: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
    red: {
      iconBg: 'from-red-500/20 to-red-500/5',
      iconBorder: 'border-red-500/30 group-hover:border-red-500/50',
      iconColor: 'text-red-400',
      glow: 'shadow-red-500/20',
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.4,
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="group relative overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${styles.iconBg} flex items-center justify-center border ${styles.iconBorder}`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {isNumber && typeof value === 'number' ? (
                <AnimatedNumber value={value} />
              ) : (
                value
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// FIXED: Added hasPremium parameter
export function OverviewStats({ profileViews, uidNumber, username, profileId, hasPremium = false }: OverviewStatsProps) {
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
    <div className="space-y-4">
      {/* FIXED: Added Premium Upgrade Button if user doesn't have premium */}
      {!hasPremium && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/premium">
            <Button
              className="w-full h-auto p-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:via-amber-500 hover:to-yellow-500 text-black font-bold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 group"
            >
              <div className="flex items-center justify-center gap-3 w-full">
                <Crown className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                  <span className="text-lg">Upgrade to Premium</span>
                  <span className="text-xs font-normal opacity-80">Unlock exclusive features & customization</span>
                </div>
                <Sparkles className="w-5 h-5 ml-auto group-hover:rotate-12 transition-transform" />
              </div>
            </Button>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={Eye}
          value={profileViews}
          label="Views"
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
        <StatCard
          icon={ThumbsUp}
          value={likesCount}
          label="Likes"
          index={2}
          color="red"
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
          label="Clicks"
          index={5}
          color="blue"
        />
      </div>
    </div>
  );
}
