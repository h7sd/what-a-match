import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

export function ExpandingAuthMenu() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const menuItems: MenuItem[] = [
    {
      icon: LogIn,
      label: 'Sign In',
      href: '/auth'
    },
    {
      icon: UserPlus,
      label: 'Get Started',
      href: '/auth?mode=signup'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-[4px] p-1.5 rounded-[22px] bg-secondary/95 backdrop-blur-xl border border-border shadow-lg">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === index;
          const isActive = hoveredIndex !== null;
          const isFirst = index === 0;

          const content = (
            <motion.div
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              animate={{
                width: isHovered ? '145px' : '44px',
                backgroundColor: isHovered ? 'hsl(var(--primary))' : 'transparent'
              }}
              transition={{
                duration: 0.4,
                ease: [0.175, 0.885, 0.32, 1.275]
              }}
              className={cn(
                "relative h-[44px] rounded-[18px] flex items-center justify-center cursor-pointer overflow-hidden",
                isFirst && isActive && !isHovered && "opacity-100",
                !isFirst && isActive && !isHovered && "opacity-60"
              )}
            >
              <motion.div
                animate={{
                  x: isHovered ? -22 : 0
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.175, 0.885, 0.32, 1.275]
                }}
                className="flex items-center justify-center w-[44px] h-[44px]"
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isHovered ? "text-primary-foreground" : "text-foreground"
                  )}
                />
              </motion.div>

              <motion.span
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  x: isHovered ? 0 : 20
                }}
                transition={{
                  duration: 0.3,
                  delay: isHovered ? 0.1 : 0
                }}
                className="absolute right-3 text-xs font-medium text-primary-foreground whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            </motion.div>
          );

          return (
            <Link key={index} to={item.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
