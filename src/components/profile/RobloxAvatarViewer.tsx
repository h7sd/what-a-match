import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface RobloxAvatarViewerProps {
  robloxUsername: string;
  accentColor?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function RobloxAvatarViewer({ robloxUsername, accentColor = '#00b2ff' }: RobloxAvatarViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!robloxUsername) return;
    let mounted = true;

    setLoading(true);
    setError(false);
    setImageUrl(null);

    const proxyUrl = `${SUPABASE_URL}/functions/v1/roblox-avatar-proxy?username=${encodeURIComponent(robloxUsername)}`;

    fetch(proxyUrl, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then(async (res) => {
        if (!res.ok) throw new Error('not found');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (mounted) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [robloxUsername]);

  if (error) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl overflow-visible"
        style={{ width: 180, height: 260 }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
          </div>
        )}

        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
            style={{ perspective: '600px' }}
          >
            <motion.div
              animate={{ rotateY: [0, 15, 0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full h-full"
            >
              <div
                className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                style={{ background: `radial-gradient(ellipse at center, ${accentColor}, transparent 70%)` }}
              />
              <img
                src={imageUrl}
                alt={robloxUsername}
                className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                style={{ filter: `drop-shadow(0 0 20px ${accentColor}40)` }}
              />
            </motion.div>
          </motion.div>
        )}
      </div>

      {!loading && !error && (
        <p
          className="text-xs font-mono tracking-wider"
          style={{ color: `${accentColor}bb` }}
        >
          {robloxUsername}
        </p>
      )}
    </div>
  );
}
