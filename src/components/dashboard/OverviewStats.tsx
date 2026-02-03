import { Eye, Hash, User, TrendingUp } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useEffect, useState, lazy, Suspense } from 'react';

// Lazy load Aurora for performance
const Aurora = lazy(() => import('@/components/ui/Aurora'));

interface OverviewStatsProps {
  profileViews: number;
  uidNumber: number;
  username: string;
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
  color?: 'primary' | 'blue' | 'amber' | 'emerald';
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  index,
  isNumber = true,
  color = 'primary'
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const colorStyles = {
    primary: {
      iconBg: 'from-[#00B4D8]/20 via-[#00D9A5]/15 to-[#0077B6]/20',
      iconBorder: 'border-[#00D9A5]/20 group-hover:border-[#00D9A5]/40',
      iconColor: 'text-[#00D9A5]',
    },
    blue: {
      iconBg: 'from-[#00B4D8]/20 to-[#0077B6]/20',
      iconBorder: 'border-[#00B4D8]/20 group-hover:border-[#00B4D8]/40',
      iconColor: 'text-[#00B4D8]',
    },
    amber: {
      iconBg: 'from-amber-500/20 to-amber-500/5',
      iconBorder: 'border-amber-500/20 group-hover:border-amber-500/40',
      iconColor: 'text-amber-400',
    },
    emerald: {
      iconBg: 'from-[#00D9A5]/20 to-[#00D9A5]/5',
      iconBorder: 'border-[#00D9A5]/20 group-hover:border-[#00D9A5]/40',
      iconColor: 'text-[#00D9A5]',
    }
  };

  const styles = colorStyles[color];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-xl p-5"
    >
      {/* Aurora background effect */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
          <Aurora
            colorStops={['#00B4D8', '#00D9A5', '#0077B6']}
            amplitude={0.6}
            blend={0.7}
            speed={0.4}
          />
        </div>
      </Suspense>
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${styles.iconBg} flex items-center justify-center border ${styles.iconBorder} transition-colors mb-4`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-white">
            {isNumber && typeof value === 'number' ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </p>
          <p className="text-sm text-white/40">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function OverviewStats({ profileViews, uidNumber, username }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <StatCard 
        icon={User} 
        value={`@${username}`} 
        label="Username" 
        index={2}
        isNumber={false}
        color="amber"
      />
      <StatCard 
        icon={TrendingUp} 
        value={0} 
        label="Link Clicks" 
        index={3}
        color="emerald"
      />
    </div>
  );
}
