import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CaseItem {
  id: string;
  item_type: 'badge' | 'coins' | 'premium_key';
  badge_id: string | null;
  global_badge_id: string | null;
  coin_amount: number | null;
  rarity: string;
  drop_rate: number;
  display_value: number;
  badge?: {
    name: string;
    icon_url: string;
    color: string;
  } | null;
  global_badge?: {
    name: string;
    icon_url: string;
    color: string;
  } | null;
}

export interface Case {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  gradient_css: string | null;
  accent_color: string | null;
  price: number;
  active: boolean;
  order_index: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_type: 'badge' | 'coins' | 'premium_key';
  badge_id: string | null;
  coin_amount: number | null;
  rarity: string;
  estimated_value: number;
  won_from_case_id: string | null;
  won_at: string;
  sold: boolean;
  sold_at: string | null;
  badge?: {
    name: string;
    icon_url: string;
    color: string;
  };
  case?: {
    name: string;
  };
}

export interface CaseTransaction {
  id: string;
  user_id: string;
  case_id: string;
  transaction_type: string;
  items_won: any;
  total_value: number;
  created_at: string;
  case: {
    name: string;
    image_url: string;
  };
}

export function useUserBalance() {
  return useQuery({
    queryKey: ['user-balance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return BigInt(0);

      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data ? BigInt(data.balance) : BigInt(0);
    },
  });
}

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Case[];
    },
  });
}

export function useCaseItems(caseId: string | null) {
  return useQuery({
    queryKey: ['case-items', caseId],
    queryFn: async () => {
      if (!caseId) return null;

      const { data, error } = await supabase
        .from('case_items')
        .select(`
          *,
          badge:badge_id (
            name,
            icon_url,
            color
          ),
          global_badge:global_badge_id (
            name,
            icon_url,
            color
          )
        `)
        .eq('case_id', caseId)
        .order('drop_rate', { ascending: false });

      if (error) throw error;
      return data as CaseItem[];
    },
    enabled: !!caseId,
  });
}

export function useOpenCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/open-case`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ caseId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open case');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['case-transactions'] });

      const rarity = data.item.rarity;
      if (rarity === 'legendary') {
        toast.success('Legendary drop! Amazing!', { duration: 5000 });
      } else if (rarity === 'premium') {
        toast.success('PREMIUM KEY! Unbelievably rare!', { duration: 8000 });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ['user-inventory'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_inventory')
        .select('id, user_id, item_type, item_id, item_data, quantity, acquired_at')
        .eq('user_id', user.id)
        .order('acquired_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => {
        const d = row.item_data || {};
        return {
          id: row.id,
          user_id: row.user_id,
          item_type: row.item_type || d.item_type || 'badge',
          badge_id: d.badge_id || d.global_badge_id || null,
          coin_amount: d.coin_amount || null,
          rarity: d.rarity || 'common',
          estimated_value: d.display_value || 0,
          won_from_case_id: null,
          won_at: row.acquired_at,
          sold: false,
          sold_at: null,
          badge: d.badge || null,
          case: null,
        } as InventoryItem;
      });
    },
  });
}

export function useSellItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemIds, sellAll }: { itemIds?: string[]; sellAll?: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sell-inventory-item`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ itemIds, sellAll }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sell items');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      queryClient.invalidateQueries({ queryKey: ['user-inventory'] });
      toast.success(`Sold ${data.itemsSold} items for ${data.coinsEarned} coins!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCaseTransactions() {
  return useQuery({
    queryKey: ['case-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('case_transactions')
        .select(`
          *,
          case:case_id (
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CaseTransaction[];
    },
  });
}
