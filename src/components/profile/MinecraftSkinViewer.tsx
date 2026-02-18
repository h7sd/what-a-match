import { useEffect, useRef, useState } from 'react';
import { SkinViewer, WalkingAnimation } from 'skinview3d';
import { Loader2 } from 'lucide-react';

interface MinecraftSkinViewerProps {
  mcUsername: string;
  accentColor?: string;
}

const DESKTOP_WIDTH = 380;
const DESKTOP_HEIGHT = 560;
const MOBILE_WIDTH = 220;
const MOBILE_HEIGHT = 320;

function getIsMobile() {
  return window.innerWidth < 640;
}

export function MinecraftSkinViewer({ mcUsername, accentColor = '#6366f1' }: MinecraftSkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    function handleResize() {
      setIsMobile(getIsMobile());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = isMobile ? MOBILE_WIDTH : DESKTOP_WIDTH;
  const height = isMobile ? MOBILE_HEIGHT : DESKTOP_HEIGHT;

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
      width,
      height,
      alpha: true,
    });

    viewer.renderer.setClearColor(0x000000, 0);
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.8;
    viewer.animation = new WalkingAnimation();
    (viewer.animation as WalkingAnimation).speed = 0.8;
    viewer.zoom = 0.85;
    viewer.fov = 70;
    viewer.globalLight.intensity = 3;
    viewer.cameraLight.intensity = 1;

    viewerRef.current = viewer;

    viewer.loadSkin(skinUrl).then(() => {
      if (!destroyed) setLoading(false);
    }).catch(() => {
      if (!destroyed) {
        setError(true);
        setLoading(false);
      }
    });

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [mcUsername, width, height]);

  if (error) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          width,
          height,
          background: 'transparent',
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
