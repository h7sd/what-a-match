import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface DiscordOAuthResult {
  success: boolean;
  is_new_user?: boolean;
  email?: string;
  action_link?: string;
  discord_user?: DiscordUser;
  error?: string;
}

export function useDiscordOAuth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getRedirectUri = useCallback(() => {
    return `https://api.uservault.cc/functions/v1/discord-oauth-callback`;
  }, []);

  const initiateDiscordLogin = useCallback(async () => {
    setLoading(true);
    try {
      // Redirect back to the currently running app (preview or production)
      const targetOrigin = window.location.origin;
      // Get the OAuth URL from our edge function
      const { data, error } = await supabase.functions.invoke('discord-oauth', {
        body: { 
          action: 'get_auth_url',
          redirect_uri: getRedirectUri(),
          frontend_origin: targetOrigin
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to get Discord auth URL');
      }

      // Store state in sessionStorage for verification
      sessionStorage.setItem('discord_oauth_state', data.state);
      sessionStorage.setItem('discord_oauth_mode', 'login');

      // Redirect to Discord
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Discord OAuth error:', err);
      toast({
        title: 'Discord login failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [getRedirectUri, toast]);

  const initiateDiscordLink = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Redirect back to the currently running app (preview or production)
      const targetOrigin = window.location.origin;
      const { data, error } = await supabase.functions.invoke('discord-oauth', {
        body: {
          action: 'get_auth_url',
          redirect_uri: getRedirectUri(),
          frontend_origin: targetOrigin,
          mode: 'link',
          user_id: userId,
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to get Discord auth URL');
      }

      // Store state and mode for callback
      sessionStorage.setItem('discord_oauth_state', data.state);
      sessionStorage.setItem('discord_oauth_mode', 'link');
      sessionStorage.setItem('discord_oauth_user_id', userId);

      // Redirect to Discord
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Discord link error:', err);
      toast({
        title: 'Failed to link Discord',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [getRedirectUri, toast]);

  const handleOAuthCallback = useCallback(async (code: string, state: string): Promise<DiscordOAuthResult> => {
    setLoading(true);
    try {
      // The state is base64-encoded JSON from the backend, not from sessionStorage
      // Parse the state to extract nonce and origin for validation
      let parsedState: { nonce?: string; origin?: string; mode?: string; user_id?: string } = {};
      try {
        const decodedState = atob(state);
        parsedState = JSON.parse(decodedState);
      } catch (e) {
        console.warn('Could not parse state, proceeding anyway:', e);
      }

      // Read mode/user_id from state (reliable) with sessionStorage as fallback
      let mode = parsedState.mode || sessionStorage.getItem('discord_oauth_mode') || 'login';
      let userId = parsedState.user_id || sessionStorage.getItem('discord_oauth_user_id') || null;

      // Clear stored state
      sessionStorage.removeItem('discord_oauth_state');
      sessionStorage.removeItem('discord_oauth_mode');
      sessionStorage.removeItem('discord_oauth_user_id');

      // Exchange code for tokens and user info
      const { data, error } = await supabase.functions.invoke('discord-oauth-callback', {
        body: {
          code,
          state,
          redirect_uri: getRedirectUri(),
          mode,
          user_id: userId,
        }
      });

      if (error) {
        let errorMessage = (error as any)?.message || 'OAuth callback failed';
        try {
          const errorBody = await (error as any).context?.json?.();
          if (errorBody) {
            errorMessage = errorBody.message || errorBody.error || errorMessage;
          }
        } catch {}
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.message || data.error || 'OAuth callback failed');
      }

      if (mode === 'login' && data.action_link) {
        try {
          const actionUrl = new URL(data.action_link);

          const hashStr = actionUrl.hash?.substring(1);
          if (hashStr) {
            const hashParams = new URLSearchParams(hashStr);
            const at = hashParams.get('access_token');
            const rt = hashParams.get('refresh_token');
            if (at && rt) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: at,
                refresh_token: rt,
              });
              if (!sessionError) {
                return { success: true, ...data };
              }
            }
          }

          const token = actionUrl.searchParams.get('token');
          const type = actionUrl.searchParams.get('type');

          if (token && type === 'magiclink') {
            const { error: otpError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'magiclink',
            });

            if (!otpError) {
              return { success: true, ...data };
            }
            console.error('OTP verify error:', otpError);
          }

          window.location.href = data.action_link;
          return { success: true, ...data };
        } catch (linkErr) {
          console.error('Action link processing error:', linkErr);
          window.location.href = data.action_link;
          return { success: true, ...data };
        }
      }

      return { success: true, ...data };
    } catch (err: any) {
      console.error('Discord callback error:', err);
      toast({
        title: 'Discord authentication failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [getRedirectUri, toast]);

  return {
    loading,
    initiateDiscordLogin,
    initiateDiscordLink,
    handleOAuthCallback,
  };
}
