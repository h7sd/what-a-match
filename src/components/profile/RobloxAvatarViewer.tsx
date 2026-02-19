import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

interface RobloxAvatarViewerProps {
  robloxUsername: string;
  accentColor?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const PROXY_BASE = `${SUPABASE_URL}/functions/v1/roblox-avatar-proxy`;
const CDN_BASE = 'https://t3.rbxcdn.com';

function proxyUrl(cdnPath: string): string {
  const full = cdnPath.startsWith('http') ? cdnPath : `${CDN_BASE}/${cdnPath}`;
  return `${PROXY_BASE}?mode=proxy&url=${encodeURIComponent(full)}`;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.text();
}

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.blob();
}

export function RobloxAvatarViewer({ robloxUsername, accentColor = '#00b2ff' }: RobloxAvatarViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const width = isMobile ? 220 : 380;
  const height = isMobile ? 320 : 560;

  useEffect(() => {
    if (!canvasRef.current || !robloxUsername) return;

    let cancelled = false;

    const canvas = canvasRef.current;

    setLoading(true);
    setError(false);

    // Cleanup previous renderer
    if (rendererRef.current) {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const run = async () => {
      try {
        // Step 1: get 3D model manifest
        const infoUrl = `${PROXY_BASE}?username=${encodeURIComponent(robloxUsername)}&mode=3d-info`;
        const infoRes = await fetch(infoUrl, { headers: { apikey: SUPABASE_ANON_KEY } });
        if (!infoRes.ok || cancelled) throw new Error('3d-info failed');
        const info = await infoRes.json();
        if (info.error || !info.objUrl) throw new Error(info.error || 'no objUrl');

        // The objUrl returns a JSON manifest
        const manifestRes = await fetch(proxyUrl(info.objUrl), { headers: { apikey: SUPABASE_ANON_KEY } });
        if (!manifestRes.ok || cancelled) throw new Error('manifest fetch failed');
        const manifest = await manifestRes.json();

        const { obj: objId, mtl: mtlId, textures: textureIds, camera, aabb } = manifest;

        // Step 2: fetch MTL text
        const mtlText = await fetchText(proxyUrl(mtlId));
        if (cancelled) return;

        // Step 3: fetch OBJ text
        const objText = await fetchText(proxyUrl(objId));
        if (cancelled) return;

        // Step 4: load all textures as blob URLs
        const textureMap: Record<string, string> = {};
        await Promise.all((textureIds || []).map(async (texId: string) => {
          try {
            const blob = await fetchBlob(proxyUrl(texId));
            textureMap[texId] = URL.createObjectURL(blob);
          } catch { /* skip failed textures */ }
        }));
        if (cancelled) return;

        // Step 5: patch MTL to use blob URLs
        const patchedMtl = mtlText.replace(/map_\w+\s+(\S+)/g, (match, texName) => {
          const blobUrl = textureMap[texName];
          return blobUrl ? match.replace(texName, blobUrl) : match;
        });

        // Step 6: parse MTL
        const mtlLoader = new MTLLoader();
        mtlLoader.setResourcePath('');
        const materials = mtlLoader.parse(patchedMtl, '');
        materials.preload();

        // Step 7: parse OBJ with materials
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        const object = objLoader.parse(objText);
        if (cancelled) return;

        // Step 8: setup Three.js scene
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        const aspect = width / height;

        // Use camera data from manifest if available
        let camFov = camera?.fov ?? 30;
        const threeCamera = new THREE.PerspectiveCamera(camFov, aspect, 0.1, 10000);

        // Center model using AABB
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object.position.sub(center);

        scene.add(object);

        // Position camera to frame the model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = (camFov * Math.PI) / 180;
        const camDist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.5;
        threeCamera.position.set(0, 0, camDist);
        threeCamera.lookAt(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
        dirLight1.position.set(5, 10, 7);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight2.position.set(-5, -5, -5);
        scene.add(dirLight2);

        if (!cancelled) setLoading(false);

        // Auto-rotate animation
        let angle = 0;
        const animate = () => {
          if (cancelled) return;
          animFrameRef.current = requestAnimationFrame(animate);
          angle += 0.008;
          object.rotation.y = angle;
          renderer.render(scene, threeCamera);
        };
        animate();

        // Cleanup blob URLs on unmount
        return () => {
          Object.values(textureMap).forEach(URL.revokeObjectURL);
        };
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [robloxUsername, width, height]);

  if (error) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ width, height, background: 'transparent' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
          </div>
        )}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${accentColor}, transparent 70%)` }}
        />
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.5s ease',
            position: 'relative',
            zIndex: 1,
          }}
        />
      </div>
      {!loading && !error && (
        <p className="text-xs font-mono tracking-wider" style={{ color: `${accentColor}bb` }}>
          {robloxUsername}
        </p>
      )}
    </div>
  );
}
