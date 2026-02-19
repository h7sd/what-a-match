import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiSpotify } from 'react-icons/si';

interface SpotifyTrack {
  playing: boolean;
  song?: string;
  artist?: string;
  album?: string;
  albumArt?: string | null;
  durationMs?: number;
  progressMs?: number;
  trackId?: string;
}

interface SpotifyNowPlayingProps {
  userId: string;
  accentColor?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function fetchNowPlaying(userId: string): Promise<SpotifyTrack> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/spotify-now-playing?user_id=${encodeURIComponent(userId)}`,
    { headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string } }
  );
  if (!res.ok) return { playing: false };
  return await res.json();
}

export function SpotifyNowPlaying({ userId, accentColor = '#1DB954' }: SpotifyNowPlayingProps) {
  const [track, setTrack] = useState<SpotifyTrack>({ playing: false });
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const progressRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch from secure edge function
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await fetchNowPlaying(userId);
      if (!mounted) return;
      setTrack(data);
      if (data.playing && data.progressMs !== undefined) {
        progressRef.current = data.progressMs;
        setElapsed(data.progressMs);
        setProgress(data.durationMs ? (data.progressMs / data.durationMs) * 100 : 0);
      }
    };

    load();
    fetchRef.current = setInterval(load, 30_000);

    return () => {
      mounted = false;
      if (fetchRef.current) clearInterval(fetchRef.current);
    };
  }, [userId]);

  // Smooth local progress tick every second
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!track.playing || !track.durationMs) return;

    tickRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 1000, track.durationMs!);
      const pct = (progressRef.current / track.durationMs!) * 100;
      setElapsed(progressRef.current);
      setProgress(Math.min(pct, 100));
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [track.trackId, track.playing]);

  if (!track.playing || !track.song) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={track.trackId}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
      >
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-black/50"
          style={{ boxShadow: `0 8px 32px ${accentColor}20, 0 0 0 1px ${accentColor}15` }}
        >
          {/* Album art blurred background */}
          {track.albumArt && (
            <div
              className="absolute inset-0 opacity-20 scale-110 blur-2xl"
              style={{
                backgroundImage: `url(${track.albumArt})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          <div className="relative z-10 p-4">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-4">
              <SiSpotify className="w-3.5 h-3.5" style={{ color: '#1DB954' }} />
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Now Playing</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Spinning vinyl record */}
              <div className="relative flex-shrink-0 w-20 h-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, #111 0%, #222 25%, #111 50%, #1a1a1a 75%, #111 100%)`,
                    boxShadow: `0 0 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5)`,
                  }}
                >
                  {[0.85, 0.72, 0.59].map((scale, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border border-white/5"
                      style={{ inset: `${((1 - scale) / 2) * 100}%` }}
                    />
                  ))}
                </motion.div>

                {/* Spinning album art */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                  className="absolute rounded-full overflow-hidden border-2 border-black/60"
                  style={{ inset: '20%' }}
                >
                  {track.albumArt ? (
                    <img src={track.albumArt} alt={track.album} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1DB954]/20 flex items-center justify-center">
                      <SiSpotify className="w-4 h-4 text-[#1DB954]" />
                    </div>
                  )}
                </motion.div>

                <div
                  className="absolute w-2 h-2 rounded-full bg-black border border-white/20"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                />
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm leading-tight truncate" title={track.song}>
                  {track.song}
                </p>
                <p className="text-white/60 text-xs truncate mt-0.5" title={track.artist}>
                  {track.artist}
                </p>
                {track.album && (
                  <p className="text-white/35 text-[11px] truncate mt-0.5" title={track.album}>
                    {track.album}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="relative h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: '#1DB954' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'linear' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/35">
                    <span>{formatTime(elapsed)}</span>
                    <span>{formatTime(track.durationMs ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
