import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DUEL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/case-duel`;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export interface CaseDuel {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  is_bot_opponent: boolean;
  case_id: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined' | 'expired';
  challenger_item_data: any | null;
  opponent_item_data: any | null;
  winner_id: string | null;
  bot_won: boolean;
  coins_wagered: number;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export function useDuels() {
  return useQuery({
    queryKey: ['case-duels'],
    queryFn: async () => {
      const headers = await authHeaders();
      const res = await fetch(`${DUEL_URL}/list`, { headers: { ...headers, 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed to load duels');
      const data = await res.json();
      return data.duels as CaseDuel[];
    },
  });
}

export function useCreateDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { caseId: string; opponentId?: string; isBotOpponent?: boolean }) => {
      const headers = await authHeaders();
      const res = await fetch(`${DUEL_URL}/challenge`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create duel');
      return data.duel as CaseDuel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-duels'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAcceptDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (duelId: string) => {
      const headers = await authHeaders();
      const res = await fetch(`${DUEL_URL}/accept`, {
        method: 'POST', headers, body: JSON.stringify({ duelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case-duels'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeclineDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (duelId: string) => {
      const headers = await authHeaders();
      const res = await fetch(`${DUEL_URL}/decline`, {
        method: 'POST', headers, body: JSON.stringify({ duelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to decline');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case-duels'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useOpenDuel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (duelId: string) => {
      const headers = await authHeaders();
      const res = await fetch(`${DUEL_URL}/open`, {
        method: 'POST', headers, body: JSON.stringify({ duelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-duels'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
