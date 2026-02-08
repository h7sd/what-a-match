import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, LogIn, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  primary?: boolean;
}

export function ExpandingAuthMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      icon: LogIn,
      label: 'Sign In',
      href: '/auth'
    },
    {
      icon: UserPlus,
      label: 'Get Started',
      href: '/auth',
      primary: true
    }
  ];

  return (
    <div className="relative">
      <motion.button
        onHoverStart={() => setIsOpen(true)}
        onHoverEnd={() => setIsOpen(false)}
        className={cn(
          "flex items-center justify-center w-[44px] h-[44px] rounded-full transition-all duration-300",
          "bg-secondary/50 backdrop-blur-sm border border-border/50",
          "hover:bg-muted hover:border-border shadow-lg"
        )}
      >
        <User className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.175, 0.885, 0.32, 1.275] }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            className="absolute top-full right-0 mt-2 w-[180px] bg-secondary/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      item.primary
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
