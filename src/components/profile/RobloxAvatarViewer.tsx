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

function assetUrl(assetId: string): string {
  return `${PROXY_BASE}?mode=asset&asset=${encodeURIComponent(assetId)}`;
}

async function fetchViaProxy(assetId: string): Promise<Response> {
  return fetch(assetUrl(assetId), { headers: { apikey: SUPABASE_ANON_KEY } });
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
    const blobUrls: string[] = [];
    const canvas = canvasRef.current;

    setLoading(true);
    setError(false);

    if (rendererRef.current) {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    const run = async () => {
      try {
        // Step 1: Get manifest (resolves username -> asset IDs)
        const manifestRes = await fetch(
          `${PROXY_BASE}?username=${encodeURIComponent(robloxUsername)}&mode=3d`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        if (!manifestRes.ok || cancelled) throw new Error('manifest failed');
        const manifest = await manifestRes.json();
        if (manifest.error) throw new Error(manifest.error);

        const { objId, mtlId, textureIds, camera } = manifest;

        // Step 2: Fetch OBJ and MTL text via proxy (proxy tries all CDN subdomains)
        const [mtlRes, objRes] = await Promise.all([
          fetchViaProxy(mtlId),
          fetchViaProxy(objId),
        ]);
        if (cancelled) return;
        if (!mtlRes.ok || !objRes.ok) throw new Error('OBJ/MTL fetch failed');

        const [mtlText, objText] = await Promise.all([mtlRes.text(), objRes.text()]);
        if (cancelled) return;

        // Step 3: Fetch textures via proxy and create blob URLs
        const textureMap: Record<string, string> = {};
        await Promise.all(
          (textureIds || []).map(async (texId: string) => {
            try {
              const res = await fetchViaProxy(texId);
              if (!res.ok) return;
              const blob = await res.blob();
              const blobUrl = URL.createObjectURL(blob);
              blobUrls.push(blobUrl);
              textureMap[texId] = blobUrl;
            } catch { /* skip failed textures */ }
          })
        );
        if (cancelled) return;

        // Step 4: Patch MTL - replace texture IDs with blob URLs, remove map_d (alpha) to fix transparency
        let patchedMtl = mtlText
          .replace(/^\s*map_d\s+\S+.*$/gm, '')
          .replace(/^\s*d\s+\d.*$/gm, 'd 1')
          .replace(/map_\w+\s+(\S+)/g, (match, texName) => {
            const blobUrl = textureMap[texName];
            return blobUrl ? match.replace(texName, blobUrl) : match;
          });

        // Step 5: Parse materials
        const mtlLoader = new MTLLoader();
        mtlLoader.setResourcePath('');
        const materials = mtlLoader.parse(patchedMtl, '');
        materials.preload();

        // Step 6: Parse OBJ with materials
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        const object = objLoader.parse(objText);
        if (cancelled) return;

        // Step 7: Setup Three.js scene
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        const camFov = camera?.fov ?? 30;
        const threeCamera = new THREE.PerspectiveCamera(camFov, width / height, 0.1, 10000);

        // Center model using bounding box
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        object.position.sub(center);
        scene.add(object);

        // Frame camera to show full model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = (camFov * Math.PI) / 180;
        const camDist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.6;
        threeCamera.position.set(0, 0, camDist);
        threeCamera.lookAt(0, 0, 0);

        // Lighting - natural, no bloom/glow
        scene.add(new THREE.AmbientLight(0xffffff, 2.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(3, 8, 5);
        scene.add(dirLight);
        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-3, -2, -4);
        scene.add(backLight);

        if (!cancelled) setLoading(false);

        // Auto-rotate animation loop
        let angle = 0;
        const animate = () => {
          if (cancelled) return;
          animFrameRef.current = requestAnimationFrame(animate);
          angle += 0.008;
          object.rotation.y = angle;
          renderer.render(scene, threeCamera);
        };
        animate();

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
      blobUrls.forEach(URL.revokeObjectURL);
    };
  }, [robloxUsername, width, height]);

  if (error) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-2xl"
        style={{ width, height, background: 'transparent' }}
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
