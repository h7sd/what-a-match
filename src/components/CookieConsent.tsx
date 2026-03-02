import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'uv_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-6 z-[9999] max-w-sm"
        >
          <div className="relative bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-2xl shadow-black/30">
            <button
              onClick={accept}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#991b1b]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-[#dc2626]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Cookies
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  We use cookies to keep you logged in and make your experience better. By continuing, you agree to our use of cookies.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={accept}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white hover:opacity-90 transition-opacity"
                  >
                    Got it
                  </button>
                  <a
                    href="/privacy"
                    className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
