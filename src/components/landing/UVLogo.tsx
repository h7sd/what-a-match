import { motion } from 'framer-motion';

interface UVLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function UVLogo({ size = 32, className = '', animated = true }: UVLogoProps) {
  const gradient = animated ? (
    <motion.linearGradient
      id="uv-gradient"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="100%"
      animate={{
        x1: ['0%', '100%', '0%'],
        y1: ['0%', '50%', '0%'],
        x2: ['100%', '0%', '100%'],
        y2: ['100%', '50%', '100%'],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <stop offset="0%" stopColor="#00B4D8" />
      <stop offset="50%" stopColor="#00D9A5" />
      <stop offset="100%" stopColor="#0077B6" />
    </motion.linearGradient>
  ) : (
    <linearGradient id="uv-gradient-static" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#00B4D8" />
      <stop offset="50%" stopColor="#00D9A5" />
      <stop offset="100%" stopColor="#0077B6" />
    </linearGradient>
  );

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <defs>
        {gradient}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        stroke="url(#uv-gradient)"
        strokeWidth="2.5"
        fill="rgba(0, 180, 216, 0.05)"
        filter="url(#glow)"
      />

      <path
        d="M12 20V32C12 37.523 16.477 42 22 42C27.523 42 32 37.523 32 32V20"
        stroke="url(#uv-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />

      <path
        d="M38 20L47 44L56 20"
        stroke="url(#uv-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
      />
    </motion.svg>
  );
}

export function UVLogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold ${className}`}>
      <span className="bg-gradient-to-r from-[#00B4D8] via-[#00D9A5] to-[#0077B6] bg-clip-text text-transparent">
        User
      </span>
      <span className="bg-gradient-to-r from-[#00D9A5] to-[#0077B6] bg-clip-text text-transparent">
        Vault
      </span>
    </span>
  );
}
