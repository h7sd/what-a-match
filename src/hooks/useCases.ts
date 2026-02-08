import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CaseItem {
  id: string;
  item_type: 'badge' | 'coins';
  badge_id: string | null;
  coin_amount: number | null;
  rarity: string;
  drop_rate: number;
  display_value: number;
  badge?: {
    name: string;
    icon_url: string;
    color: string;
  };
}

export interface Case {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  active: boolean;
  order_index: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_type: 'badge' | 'coins';
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

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      console.log('[useCases] Fetching cases...');
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[useCases] Error fetching cases:', error);
        throw error;
      }

      console.log('[useCases] Cases fetched:', data);
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
      if (rarity === 'legendary' || rarity === 'premium') {
        toast.success(`Amazing! You won a ${rarity} item!`, {
          duration: 5000,
        });
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
        .select(`
          *,
          badge:badge_id (
            name,
            icon_url,
            color
          ),
          case:won_from_case_id (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('sold', false)
        .order('won_at', { ascending: false });

      if (error) throw error;
      return data as InventoryItem[];
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
