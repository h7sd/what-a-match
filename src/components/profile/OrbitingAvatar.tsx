import { motion } from 'framer-motion';

interface OrbitingAvatarProps {
  avatarUrl?: string;
  displayName?: string;
  size?: number;
  accentColor?: string;
  shape?: 'circle' | 'rounded' | 'soft' | 'square';
}

export function OrbitingAvatar({
  avatarUrl,
  displayName = '?',
  size = 150,
  accentColor = '#8B5CF6',
  shape = 'circle',
}: OrbitingAvatarProps) {
  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-3xl',
    soft: 'rounded-2xl',
    square: 'rounded-lg',
  };

  // Don't render anything if no avatar URL
  if (!avatarUrl) {
    return null;
  }

  return (
    <div 
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Orbiting particle */}
      <motion.div
        className="absolute inset-[-4px] pointer-events-none"
        style={{
          borderRadius: shape === 'circle' ? '50%' : '24px',
        }}
      >
        <motion.div
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: `radial-gradient(circle, ${accentColor}, transparent)`,
            boxShadow: `0 0 10px ${accentColor}`,
            filter: 'blur(1px)',
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          initial={{ x: size / 2 - 6, y: -6 }}
        />
      </motion.div>

      {/* Glow ring */}
      <motion.div
        className="absolute inset-[-4px] pointer-events-none"
        style={{
          borderRadius: shape === 'circle' ? '50%' : '24px',
          background: `conic-gradient(from 0deg, ${accentColor}40, transparent, ${accentColor}40)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Avatar */}
      <motion.div
        className={`relative w-full h-full overflow-hidden ${shapeClasses[shape]}`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Inner glow */}
      <div
        className={`absolute inset-0 pointer-events-none ${shapeClasses[shape]}`}
        style={{
          boxShadow: `inset 0 0 30px ${accentColor}20`,
        }}
      />
    </div>
  );
}
