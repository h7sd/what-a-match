import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Sparkles,
  Music,
  Globe,
  Zap,
  Palette,
  Shield,
  MessageCircle,
  Activity,
  Package
} from 'lucide-react';
import { SplitText } from './SplitText';
import { Link } from 'react-router-dom';

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  size: 'small' | 'medium' | 'large';
  iconBg: string;
  link?: string;
}

const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: 'Stunning Effects',
    description: 'Sparkles, glows, tilt effects, and custom animations to make your page truly unique.',
    gradient: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
    iconBg: 'from-emerald-500 to-teal-500',
    size: 'large',
  },
  {
    icon: Music,
    title: 'Profile Music',
    description: 'Add background music for an immersive experience.',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    iconBg: 'from-cyan-500 to-blue-500',
    size: 'small',
  },
  {
    icon: Globe,
    title: 'Social Links',
    description: 'Connect all your socials in one beautiful page.',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    iconBg: 'from-blue-500 to-indigo-500',
    size: 'small',
  },
  {
    icon: Zap,
    title: 'Live Integrations',
    description: 'Show your Spotify activity, Discord status, and more in real-time.',
    gradient: 'from-primary/10 to-accent/10',
    iconBg: 'from-primary to-accent',
    size: 'medium',
  },
  {
    icon: Palette,
    title: 'Full Customization',
    description: 'Colors, fonts, layouts, and effects. Make it yours.',
    gradient: 'from-teal-500/10 to-emerald-500/10',
    iconBg: 'from-teal-500 to-emerald-500',
    size: 'medium',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Control who sees what with granular visibility settings.',
    gradient: 'from-slate-500/10 to-zinc-500/10',
    iconBg: 'from-slate-400 to-zinc-500',
    size: 'small',
  },
  {
    icon: MessageCircle,
    title: 'Discord Presence',
    description: 'Live Discord status directly on your profile.',
    gradient: 'from-indigo-500/10 to-violet-500/10',
    iconBg: 'from-indigo-500 to-violet-500',
    size: 'small',
  },
  {
    icon: Activity,
    title: 'Analytics',
    description: 'Track views, clicks, and engagement.',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    iconBg: 'from-cyan-500 to-teal-500',
    size: 'small',
  },
  {
    icon: Package,
    title: 'Case Opening',
    description: 'Open cases with your coins to win exclusive badges and the ultra-rare 1-in-50,000 Premium Key.',
    gradient: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10',
    iconBg: 'from-amber-500 to-orange-500',
    size: 'medium',
    link: '/cases',
  },
];

function FeatureCard({ feature, index }: { feature: FeatureItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const Icon = feature.icon;

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-1',
    large: 'col-span-1 md:col-span-2',
  };

  const cardInner = (
    <div className="relative h-full p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/30 overflow-hidden transition-all duration-500 hover:border-amber-500/30 hover:bg-card/60" style={feature.link ? { borderColor: 'rgba(245,158,11,0.2)' } : {}}>
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[80px] opacity-0 group-hover:opacity-100 transition-all duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          {feature.link && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Play Now
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        {feature.link && (
          <p className="mt-4 text-xs text-amber-500/70 font-medium">
            1-in-50,000 chance at a Premium Key →
          </p>
        )}
      </div>

      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`${sizeClasses[feature.size]} group relative`}
    >
      {feature.link ? (
        <Link to={feature.link} className="block h-full">
          {cardInner}
        </Link>
      ) : cardInner}
    </motion.div>
  );
}

export function BentoFeatures() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Everything you need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Packed with powerful features to create the perfect bio page that stands out
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
