import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiSpotify } from 'react-icons/si';
import { useDiscordPresence } from '@/hooks/useDiscordPresence';

interface SpotifyNowPlayingProps {
  discordUserId: string;
  accentColor?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function SpotifyNowPlaying({ discordUserId, accentColor = '#1DB954' }: SpotifyNowPlayingProps) {
  const { data } = useDiscordPresence(discordUserId);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spotify = data?.isListeningToSpotify ? data.spotify : null;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!spotify) {
      setProgress(0);
      setElapsed(0);
      setDuration(0);
      return;
    }

    const updateProgress = () => {
      const now = Date.now();
      const start = spotify.timestamps.start;
      const end = spotify.timestamps.end;
      const totalDuration = end - start;
      const currentElapsed = now - start;

      setDuration(totalDuration);
      setElapsed(Math.min(currentElapsed, totalDuration));
      setProgress(Math.min((currentElapsed / totalDuration) * 100, 100));
    };

    updateProgress();
    intervalRef.current = setInterval(updateProgress, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spotify?.track_id]);

  if (!data?.isListeningToSpotify || !spotify) return null;

  const albumArt = spotify.album_art_url;

  return (
    <AnimatePresence>
      <motion.div
        key={spotify.track_id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm mx-auto"
      >
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-black/50"
          style={{ boxShadow: `0 8px 32px ${accentColor}20, 0 0 0 1px ${accentColor}15` }}
        >
          {/* Blurred background from album art */}
          {albumArt && (
            <div
              className="absolute inset-0 opacity-20 scale-110 blur-2xl"
              style={{
                backgroundImage: `url(${albumArt})`,
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
              {/* Vinyl record with spinning album art */}
              <div className="relative flex-shrink-0 w-20 h-20">
                {/* Outer vinyl ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, #111 0%, #222 25%, #111 50%, #1a1a1a 75%, #111 100%)`,
                    boxShadow: `0 0 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5)`,
                  }}
                >
                  {/* Vinyl grooves */}
                  {[0.85, 0.72, 0.59].map((scale, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border border-white/5"
                      style={{
                        inset: `${((1 - scale) / 2) * 100}%`,
                      }}
                    />
                  ))}
                </motion.div>

                {/* Album art in center - also spins */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                  className="absolute rounded-full overflow-hidden border-2 border-black/60"
                  style={{ inset: '20%' }}
                >
                  {albumArt ? (
                    <img
                      src={albumArt}
                      alt={spotify.album}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#1DB954]/20 flex items-center justify-center">
                      <SiSpotify className="w-4 h-4 text-[#1DB954]" />
                    </div>
                  )}
                </motion.div>

                {/* Center dot */}
                <div
                  className="absolute w-2 h-2 rounded-full bg-black border border-white/20"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                />
              </div>

              {/* Song info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-white text-sm leading-tight truncate"
                  title={spotify.song}
                >
                  {spotify.song}
                </p>
                <p className="text-white/60 text-xs truncate mt-0.5" title={spotify.artist}>
                  {spotify.artist}
                </p>
                {spotify.album && (
                  <p className="text-white/35 text-[11px] truncate mt-0.5" title={spotify.album}>
                    {spotify.album}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="relative h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: '#1DB954' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'linear' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/35">
                    <span>{formatTime(elapsed)}</span>
                    <span>{formatTime(duration)}</span>
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
