import { motion } from 'framer-motion';
import { ShoppingBag, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { ModernHeader } from '@/components/landing/ModernHeader';
import { ModernFooter } from '@/components/landing/ModernFooter';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModernHeader />

      <main className="flex-1 pt-20 px-6 pb-12 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-amber-500/20 to-primary/20 blur-3xl animate-pulse" />
              <ShoppingBag className="w-24 h-24 text-primary relative z-10 mx-auto" />
            </motion.div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-amber-500/10 to-primary/20 border border-primary/20 text-sm font-medium backdrop-blur-sm"
              >
                <Clock className="w-4 h-4 text-primary" />
                <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  Coming Soon
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </motion.div>

              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent">
                Marketplace
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                We're building an amazing marketplace where you can buy and sell exclusive badges and profile templates. Get ready to trade unique items!
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-4"
            >
              <Button asChild size="lg" className="gap-2">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <ModernFooter />
    </div>
  );
}
