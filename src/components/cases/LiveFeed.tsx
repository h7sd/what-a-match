import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface LiveFeedEntry {
  id: string;
  user_id: string;
  username: string;
  case_name: string;
  item_name: string;
  item_rarity: string;
  item_value: number;
  created_at: string;
}

const rarityColors = {
  common: 'border-l-gray-500 bg-gray-500/10',
  rare: 'border-l-blue-500 bg-blue-500/10',
  epic: 'border-l-purple-500 bg-purple-500/10',
  legendary: 'border-l-amber-500 bg-amber-500/10',
  premium: 'border-l-pink-500 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10',
};

export function LiveFeed() {
  const [feed, setFeed] = useState<LiveFeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('live_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) setFeed(data);
    } catch (error) {
      console.error('Error fetching live feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    const interval = setInterval(fetchFeed, 5000);

    const channel = supabase
      .channel('live_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_feed',
        },
        (payload) => {
          setFeed((current) => [payload.new as LiveFeedEntry, ...current].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Live Openings</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold">Live Openings</h3>
        <Badge variant="secondary" className="ml-auto">
          {feed.length}
        </Badge>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {feed.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent openings yet</p>
            </div>
          ) : (
            feed.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <div
                  className={cn(
                    'p-3 rounded-lg border-l-4 transition-all hover:scale-[1.02] cursor-pointer',
                    rarityColors[entry.item_rarity as keyof typeof rarityColors] || rarityColors.common
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {entry.username}
                        </span>
                        {(entry.item_rarity === 'legendary' || entry.item_rarity === 'premium') && (
                          <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Won <span className="font-medium text-foreground">{entry.item_name}</span>
                        {' '}from{' '}
                        <span className="font-medium text-foreground">{entry.case_name}</span>
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className="mb-1 text-[10px] capitalize"
                      >
                        {entry.item_rarity}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {entry.item_rarity === 'premium' && (
                    <motion.div
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(236, 72, 153, 0)',
                          '0 0 20px 0 rgba(236, 72, 153, 0.5)',
                          '0 0 0 0 rgba(236, 72, 153, 0)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
