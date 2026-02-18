import { useEffect, useRef, useState } from 'react';
import { SkinViewer, WalkingAnimation } from 'skinview3d';
import { Loader2 } from 'lucide-react';

interface MinecraftSkinViewerProps {
  mcUsername: string;
  accentColor?: string;
}

export function MinecraftSkinViewer({ mcUsername, accentColor = '#6366f1' }: MinecraftSkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !mcUsername) return;

    let destroyed = false;

    setLoading(true);
    setError(false);

    if (viewerRef.current) {
      viewerRef.current.dispose();
      viewerRef.current = null;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const skinUrl = `${supabaseUrl}/functions/v1/mc-skin-proxy?username=${encodeURIComponent(mcUsername)}`;

    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width: 220,
      height: 300,
      skin: skinUrl,
    });

    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.8;
    viewer.animation = new WalkingAnimation();
    (viewer.animation as WalkingAnimation).speed = 0.8;
    viewer.zoom = 0.85;
    viewer.fov = 70;
    viewer.globalLight.intensity = 3;
    viewer.cameraLight.intensity = 1;

    viewerRef.current = viewer;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!destroyed) setLoading(false);
    };
    img.onerror = () => {
      if (!destroyed) {
        setError(true);
        setLoading(false);
      }
    };
    img.src = skinUrl;
    img.crossOrigin = undefined;

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [mcUsername]);

  if (error) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: 220,
          height: 300,
          background: 'rgba(0,0,0,0.35)',
          border: `1px solid ${accentColor}33`,
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 24px ${accentColor}22`,
        }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>
      <p
        className="text-xs font-mono tracking-wider"
        style={{ color: `${accentColor}bb` }}
      >
        {mcUsername}
      </p>
    </div>
  );
}
