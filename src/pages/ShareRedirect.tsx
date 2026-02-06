import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";


/**
 * Share redirect page - redirects /s/:username to the share edge function
 * This ensures Discord/Twitter bots get proper OG meta tags
 */
const ShareRedirect = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      navigate("/", { replace: true });
      return;
    }

    // Redirect to the edge function which serves OG HTML
    // Prefer the public API domain (custom proxy). If we're not on the custom domain
    // (e.g. preview), fall back to the direct backend URL so redirects still work.
    const isOnCustomDomain = window.location.hostname.endsWith('uservault.cc');
    const baseUrl = isOnCustomDomain
      ? 'https://api.uservault.cc'
      : import.meta.env.VITE_SUPABASE_URL;

    const src = window.location.href;
    const shareUrl = `${baseUrl}/functions/v1/share?u=${encodeURIComponent(username)}&src=${encodeURIComponent(src)}`;
    window.location.replace(shareUrl);
  }, [username, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default ShareRedirect;
