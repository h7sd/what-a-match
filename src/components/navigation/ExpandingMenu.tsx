import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  FolderOpen,
  MessageCircle,
  Grid3x3,
  Package,
  Github,
  Sparkles,
  Activity,
  Bell
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LandingEventsPopover } from '@/components/landing/LandingEventsPopover';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  isPopover?: boolean;
  popoverContent?: React.ReactNode;
  external?: boolean;
  isNotificationBell?: boolean;
}

export function ExpandingMenu() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { signOut } = useAuth();

  const openChat = () => {
    window.dispatchEvent(new CustomEvent('openLiveChat'));
  };

  const menuItems: MenuItem[] = [
    {
      icon: Bell,
      label: 'Notifications',
      isNotificationBell: true
    },
    {
      icon: Grid3x3,
      label: 'Features',
      href: '/#features'
    },
    {
      icon: Package,
      label: 'Pricing',
      href: '/premium'
    },
    {
      icon: Github,
      label: 'Discord',
      href: 'https://discord.gg/uservault',
      external: true
    },
    {
      icon: Sparkles,
      label: 'Events',
      isPopover: true,
      popoverContent: <LandingEventsPopover />
    },
    {
      icon: Activity,
      label: 'Status',
      href: '/status'
    },
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
      icon: MessageCircle,
      label: 'AI Chat',
      onClick: openChat
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
      <div className="flex items-center gap-[4px] p-1.5 rounded-[22px] bg-secondary/95 backdrop-blur-xl border border-border shadow-lg">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === index;
          const isActive = hoveredIndex !== null;
          const isFirst = index === 0;

          if (item.isNotificationBell) {
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "relative h-[44px] w-[44px] rounded-[18px] flex items-center justify-center transition-opacity",
                  isActive && !isHovered && "opacity-60"
                )}
              >
                <NotificationBell />
              </div>
            );
          }

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

          if (item.isPopover) {
            return (
              <Popover key={index}>
                <PopoverTrigger asChild>
                  {content}
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={12}
                  className="w-[420px] p-3 bg-card/90 backdrop-blur-2xl border-border/50"
                >
                  {item.popoverContent}
                </PopoverContent>
              </Popover>
            );
          }

          if (item.external && item.href) {
            return (
              <a key={index} href={item.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          }

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
