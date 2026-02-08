import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  FolderOpen,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
}

export function ExpandingMenu() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { signOut } = useAuth();

  const menuItems: MenuItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard'
    },
    {
      icon: FolderOpen,
      label: 'Profile',
      href: '/dashboard#profile'
    },
    {
      icon: MessageSquare,
      label: 'Support',
      href: '/dashboard#overview'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard#settings'
    },
    {
      icon: LogOut,
      label: 'Logout',
      onClick: () => signOut()
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-[6px] p-2 rounded-[24px] bg-secondary/50 backdrop-blur-sm border border-border/50 shadow-lg">
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
                width: isHovered ? '135px' : '52px',
                backgroundColor: isHovered ? 'hsl(var(--muted))' : 'transparent'
              }}
              transition={{
                duration: 0.4,
                ease: [0.175, 0.885, 0.32, 1.275]
              }}
              className={cn(
                "relative h-[52px] rounded-[20px] flex items-center justify-center cursor-pointer overflow-hidden",
                isFirst && isActive && !isHovered && "opacity-100",
                !isFirst && isActive && !isHovered && "opacity-60"
              )}
            >
              <motion.div
                animate={{
                  x: isHovered ? -20 : 0
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.175, 0.885, 0.32, 1.275]
                }}
                className="flex items-center justify-center w-[52px] h-[52px]"
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isHovered ? "text-foreground" : "text-muted-foreground"
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
                className="absolute right-4 text-sm font-medium text-foreground whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            </motion.div>
          );

          if (item.href) {
            return (
              <Link key={index} to={item.href}>
                {content}
              </Link>
            );
          }

          return (
            <div key={index} onClick={item.onClick}>
              {content}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
