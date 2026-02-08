import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X, Sparkles, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ReportUserDialog } from './ReportUserDialog';
import { Magnet } from './Magnet';
import { UVLogo, UVLogoText } from './UVLogo';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LandingEventsPopover } from './LandingEventsPopover';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ExpandingMenu } from '@/components/navigation/ExpandingMenu';
import { ExpandingAuthMenu } from '@/components/navigation/ExpandingAuthMenu';

export function ModernHeader() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', to: '/premium' },
    { label: 'Discord', href: 'https://discord.gg/uservault', external: true },
    { label: 'Status', to: '/status' },
    { label: 'Market', to: '/marketplace', icon: ShoppingBag },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'py-3' : 'py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`flex items-center justify-between relative px-8 py-4 transition-all duration-500 ${
              isScrolled
                ? 'bg-background/80 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20'
                : 'bg-transparent'
            }`}
          >
            {user ? (
              <>
                {/* Left: Logo (logged in) */}
                <Link
                  to="/"
                  className="flex items-center gap-2 group"
                >
                  <UVLogo size={36} />
                  <UVLogoText className="text-xl hidden md:block" />
                </Link>

                {/* Center: Menu with Notifications (only desktop when logged in) */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
                  <ExpandingMenu />
                </div>

                {/* Right: Mobile elements */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 md:hidden">
                    <NotificationBell />
                  </div>

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Logo (not logged in) */}
                <Link
                  to="/"
                  className="flex items-center gap-3 group"
                >
                  <UVLogo size={36} />
                  <UVLogoText className="text-xl hidden md:block" />
                </Link>

                {/* Center: Auth Menu (only desktop when not logged in) */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
                  <ExpandingAuthMenu />
                </div>

                {/* Right side (not logged in) */}
                <div className="flex items-center gap-4">
                  <div className="hidden md:block">
                    <ReportUserDialog />
                  </div>

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all"
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[80px] z-40 md:hidden px-6"
          >
            <div className="bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl p-6 flex flex-col gap-2 shadow-2xl">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground py-3 px-4 rounded-xl hover:bg-white/5 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : link.href?.startsWith('#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-foreground py-3 px-4 rounded-xl hover:bg-white/5 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to!}
                    className="text-foreground py-3 px-4 rounded-xl hover:bg-white/5 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              )}

              <div className="pt-4 mt-2 border-t border-border/50 flex flex-col gap-3">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="text-center py-3.5 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#00D9A5] text-white font-semibold border border-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="text-center py-3 text-foreground font-medium hover:bg-white/5 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/auth"
                      className="text-center py-3.5 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#00D9A5] text-white font-semibold border border-white/10"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
