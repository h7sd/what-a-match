import { motion } from 'framer-motion';
import { SiSpotify } from 'react-icons/si';
import { Circle, Loader2 } from 'lucide-react';
import { useDiscordPresence, getActivityAssetUrl, LanyardActivity } from '@/hooks/useDiscordPresence';

interface DiscordPresenceProps {
  discordUserId: string;
  accentColor?: string;
}

const statusColors = {
  online: '#22c55e',
  idle: '#f59e0b',
  dnd: '#ef4444',
  offline: '#6b7280',
};

const activityTypeLabels: Record<number, string> = {
  0: 'Playing',
  1: 'Streaming',
  2: 'Listening to',
  3: 'Watching',
  5: 'Competing in',
};

export function DiscordPresence({ discordUserId, accentColor = '#8b5cf6' }: DiscordPresenceProps) {
  const { data, isLoading, error } = useDiscordPresence(discordUserId);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm overflow-hidden rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-6 flex items-center justify-center"
      >
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  if (error || !data) {
    return null;
  }

  const mainActivity = data.activities[0];
  const activityImage = mainActivity ? getActivityAssetUrl(mainActivity) : null;

  // Spotify takes priority if listening
  if (data.isListeningToSpotify && data.spotify) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm overflow-hidden rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
      >
        <div className="p-4 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img 
              src={data.avatar} 
              alt={data.username}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
            />
            {data.avatarDecoration && (
              <img 
                src={data.avatarDecoration}
                alt=""
                className="absolute -inset-1 w-16 h-16 pointer-events-none"
              />
            )}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black/50"
              style={{ backgroundColor: statusColors[data.status] }}
            />
          </div>

          {/* User info and activity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {data.globalName || data.username}
              </span>
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: accentColor, color: 'white' }}
              >
                UV
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#1DB954] text-xs mt-0.5">
              <SiSpotify className="w-3 h-3" />
              <span>Listening to Spotify</span>
            </div>
            <p className="text-white/80 text-xs truncate mt-0.5">{data.spotify.song}</p>
            <p className="text-white/50 text-xs truncate">by {data.spotify.artist}</p>
          </div>

          {/* Spotify album art */}
          <img
            src={data.spotify.album_art_url}
            alt={data.spotify.album}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        </div>
      </motion.div>
    );
  }

  // Game/App Activity
  if (mainActivity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm overflow-hidden rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
      >
        <div className="p-4 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img 
              src={data.avatar} 
              alt={data.username}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
            />
            {data.avatarDecoration && (
              <img 
                src={data.avatarDecoration}
                alt=""
                className="absolute -inset-1 w-16 h-16 pointer-events-none"
              />
            )}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black/50"
              style={{ backgroundColor: statusColors[data.status] }}
            />
          </div>

          {/* User info and activity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">
                {data.globalName || data.username}
              </span>
              <span 
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: accentColor, color: 'white' }}
              >
                UV
              </span>
            </div>
            <p className="text-white/60 text-xs mt-0.5">
              <span style={{ color: accentColor }}>{activityTypeLabels[mainActivity.type] || 'Playing'}</span>
              {' '}{mainActivity.name}
            </p>
            {mainActivity.details && (
              <p className="text-white/50 text-xs truncate">{mainActivity.details}</p>
            )}
            {mainActivity.state && (
              <p className="text-white/40 text-xs truncate">{mainActivity.state}</p>
            )}
          </div>

          {/* Activity image */}
          {activityImage && (
            <img
              src={activityImage}
              alt={mainActivity.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Just status, no activity
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm overflow-hidden rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
    >
      <div className="p-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img 
            src={data.avatar} 
            alt={data.username}
            className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
          />
          {data.avatarDecoration && (
            <img 
              src={data.avatarDecoration}
              alt=""
              className="absolute -inset-1 w-16 h-16 pointer-events-none"
            />
          )}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black/50"
            style={{ backgroundColor: statusColors[data.status] }}
          />
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              {data.globalName || data.username}
            </span>
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: accentColor, color: 'white' }}
            >
              UV
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Circle
              className="w-2 h-2"
              fill={statusColors[data.status]}
              stroke={statusColors[data.status]}
            />
            <span className="text-white/50 text-xs capitalize">{data.status}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
