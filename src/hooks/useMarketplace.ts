import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface MarketplaceItem {
  id: string;
  seller_id: string;
  item_type: 'badge' | 'template';
  sale_type: 'single' | 'limited' | 'unlimited';
  badge_name: string | null;
  badge_description: string | null;
  badge_icon_url: string | null;
  badge_color: string | null;
  template_name: string | null;
  template_description: string | null;
  template_preview_url: string | null;
  template_data: Record<string, unknown> | null;
  price: number;
  stock_limit: number | null;
  stock_sold: number;
  status: 'pending' | 'approved' | 'denied' | 'sold_out' | 'removed';
  denial_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  seller_username?: string;
}

export interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface UVTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'earn' | 'spend' | 'refund' | 'initial';
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

// Get user's UV balance
export function useUserBalance() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userBalance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // If no balance exists, create one with 1000 UV
      if (!data) {
        const { data: newBalance, error: insertError } = await supabase
          .from('user_balances')
          .insert({ user_id: user.id, balance: 1000, total_earned: 1000 })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newBalance as UserBalance;
      }
      
      return data as UserBalance;
    },
    enabled: !!user?.id,
  });
}

// Get UV transaction history
export function useUVTransactions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['uvTransactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('uv_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as UVTransaction[];
    },
    enabled: !!user?.id,
  });
}

// Get approved marketplace items
export function useMarketplaceItems(itemType?: 'badge' | 'template') {
  return useQuery({
    queryKey: ['marketplaceItems', itemType],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (itemType) {
        query = query.eq('item_type', itemType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch seller usernames
      const sellerIds = [...new Set(data.map(item => item.seller_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', sellerIds);
      
      const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      
      return data.map(item => ({
        ...item,
        seller_username: usernameMap.get(item.seller_id) || 'Unknown'
      })) as MarketplaceItem[];
    },
  });
}

// Get user's own marketplace items
export function useMyMarketplaceItems() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['myMarketplaceItems', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketplaceItem[];
    },
    enabled: !!user?.id,
  });
}

// Get user's purchases
export function useMyPurchases() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['myPurchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('marketplace_purchases')
        .select(`
          *,
          item:marketplace_items(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

// Create marketplace item
export function useCreateMarketplaceItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (item: Partial<MarketplaceItem>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Use any to bypass strict typing - the DB handles validation
      const { data, error } = await (supabase
        .from('marketplace_items') as any)
        .insert({
          item_type: item.item_type || 'badge',
          price: item.price || 100,
          sale_type: item.sale_type || 'unlimited',
          seller_id: user.id,
          status: 'pending',
          badge_name: item.badge_name ?? null,
          badge_description: item.badge_description ?? null,
          badge_icon_url: item.badge_icon_url ?? null,
          badge_color: item.badge_color ?? null,
          template_name: item.template_name ?? null,
          template_description: item.template_description ?? null,
          template_preview_url: item.template_preview_url ?? null,
          template_data: item.template_data ?? null,
          stock_limit: item.stock_limit ?? null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMarketplaceItems'] });
      toast.success('Item submitted for approval!');
    },
    onError: (error) => {
      toast.error('Failed to submit item: ' + error.message);
    }
  });
}

// Purchase marketplace item
export function usePurchaseItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase.rpc('purchase_marketplace_item', {
        p_item_id: itemId
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Purchase failed');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBalance'] });
      queryClient.invalidateQueries({ queryKey: ['uvTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['myPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['userBadges'] });
      toast.success('Purchase successful! 🎉');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
}

// Get pending items for admin
export function usePendingMarketplaceItems() {
  return useQuery({
    queryKey: ['pendingMarketplaceItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch seller usernames
      const sellerIds = [...new Set(data.map(item => item.seller_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', sellerIds);
      
      const usernameMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      
      return data.map(item => ({
        ...item,
        seller_username: usernameMap.get(item.seller_id) || 'Unknown'
      })) as MarketplaceItem[];
    },
  });
}

// Admin: Approve/Deny item
export function useReviewMarketplaceItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ itemId, action, reason }: { itemId: string; action: 'approved' | 'denied'; reason?: string }) => {
      const updateData: Record<string, unknown> = {
        status: action,
        denial_reason: action === 'denied' ? reason : null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('marketplace_items')
        .update(updateData)
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingMarketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      toast.success(action === 'approved' ? 'Item approved!' : 'Item denied');
    },
    onError: (error: Error) => {
      toast.error('Failed to review item: ' + error.message);
    }
  });
}
