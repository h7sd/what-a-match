import { motion } from 'framer-motion';
import { Package, Lock } from 'lucide-react';
import { ModernHeader } from '@/components/landing/ModernHeader';
import { ModernFooter } from '@/components/landing/ModernFooter';

export default function Cases() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModernHeader />

      <main className="flex-1 pt-20 flex items-center justify-center px-6">
        <section className="relative py-20 overflow-hidden w-full">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/80" />
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 via-primary/10 to-amber-500/20 border border-amber-500/20 text-sm font-medium mb-8 backdrop-blur-sm"
              >
                <Package className="w-4 h-4 text-amber-500" />
                <span className="bg-gradient-to-r from-amber-500 to-primary bg-clip-text text-transparent">
                  Case Opening System
                </span>
              </motion.div>

              <div className="p-12 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
                <Lock className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                <h1 className="text-4xl font-bold mb-4">Currently Unavailable</h1>
                <p className="text-lg text-muted-foreground">
                  The case opening system is temporarily unavailable.
                  <br />
                  Please check back later.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <ModernFooter />
    </div>
  );
}
