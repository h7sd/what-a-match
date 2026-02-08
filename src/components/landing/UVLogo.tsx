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
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <defs>
        {gradient}
      </defs>

      {/* Background rounded square */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        stroke="url(#uv-gradient)"
        strokeWidth="2"
        fill="none"
      />

      {/* U letter - clean and clear */}
      <path
        d="M12 14V23C12 26.866 15.134 30 19 30C22.866 30 26 26.866 26 23V14"
        stroke="url(#uv-gradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* V letter - clean and clear */}
      <path
        d="M28 14L33 34L38 14"
        stroke="url(#uv-gradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
