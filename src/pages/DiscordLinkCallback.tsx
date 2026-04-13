import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDiscordOAuth } from '@/hooks/useDiscordOAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function DiscordLinkCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useDiscordOAuth();
  const { toast } = useToast();

  useEffect(() => {
    const discordCode = searchParams.get('discord_code');
    const discordState = searchParams.get('discord_state');
    const error = searchParams.get('error');

    if (error) {
      toast({ title: 'Discord linking failed', description: error, variant: 'destructive' });
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!discordCode || !discordState) {
      toast({ title: 'Discord linking failed', description: 'Missing callback parameters.', variant: 'destructive' });
      navigate('/dashboard', { replace: true });
      return;
    }

    const process = async () => {
      const result = await handleOAuthCallback(discordCode, discordState);
      if (result.success) {
        toast({ title: 'Discord linked!', description: 'Your Discord account has been connected successfully.' });
      }
      navigate('/dashboard', { replace: true });
    };

    process();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto" />
        <div className="text-lg font-semibold text-foreground">Discord wird verbunden…</div>
        <div className="text-sm text-muted-foreground">Einen Moment bitte.</div>
      </div>
    </div>
  );
}
