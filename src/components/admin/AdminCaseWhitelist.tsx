import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Check, X, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

interface WhitelistEntry {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
}

interface WhitelistRequest {
  id: string;
  user_id: string;
  username: string;
  status: string;
  created_at: string;
}

export function AdminCaseWhitelist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchUsername, setSearchUsername] = useState('');
  const [addUsername, setAddUsername] = useState('');

  const { data: whitelist = [], isLoading: loadingWhitelist } = useQuery({
    queryKey: ['case-whitelist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_whitelist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhitelistEntry[];
    },
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['case-whitelist-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_whitelist_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhitelistRequest[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) throw new Error('User not found');

      const { error } = await supabase
        .from('case_whitelist')
        .insert({ user_id: profile.id, username: profile.username, added_by: user?.id });
      if (error) throw error;
      return profile;
    },
    onSuccess: (profile) => {
      toast.success(`${profile.username} added to whitelist`);
      setAddUsername('');
      queryClient.invalidateQueries({ queryKey: ['case-whitelist'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('case_whitelist')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Removed from whitelist');
      queryClient.invalidateQueries({ queryKey: ['case-whitelist'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (request: WhitelistRequest) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', request.username)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) throw new Error('User profile not found');

      const { error: wlError } = await supabase
        .from('case_whitelist')
        .insert({ user_id: profile.id, username: profile.username, added_by: user?.id })
        .select()
        .maybeSingle();
      if (wlError && !wlError.message.includes('duplicate')) throw wlError;

      const { error: reqError } = await supabase
        .from('case_whitelist_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', request.id);
      if (reqError) throw reqError;
    },
    onSuccess: () => {
      toast.success('Request approved and user whitelisted');
      queryClient.invalidateQueries({ queryKey: ['case-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['case-whitelist-requests'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('case_whitelist_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['case-whitelist-requests'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const filteredWhitelist = whitelist.filter(e =>
    e.username.toLowerCase().includes(searchUsername.toLowerCase())
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h4 className="font-semibold text-amber-400">Pending Requests ({pendingRequests.length})</h4>
          </div>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-white">{req.username}</p>
                  <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => approveRequestMutation.mutate(req)}
                    disabled={approveRequestMutation.isPending}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => rejectRequestMutation.mutate(req.id)}
                    disabled={rejectRequestMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Add User to Whitelist</label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter username..."
            value={addUsername}
            onChange={e => setAddUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addUsername.trim() && addMutation.mutate(addUsername.trim())}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
          <Button
            onClick={() => addUsername.trim() && addMutation.mutate(addUsername.trim())}
            disabled={!addUsername.trim() || addMutation.isPending}
            className="gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            Whitelisted Users ({whitelist.length})
          </label>
          <Input
            placeholder="Search..."
            value={searchUsername}
            onChange={e => setSearchUsername(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 w-40 h-8 text-sm"
          />
        </div>

        {loadingWhitelist ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-lg animate-pulse bg-white/5" />
            ))}
          </div>
        ) : filteredWhitelist.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No whitelisted users yet
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filteredWhitelist.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/8 rounded-lg px-4 py-2.5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-400">{entry.username[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{entry.username}</p>
                    <p className="text-xs text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-600 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => removeMutation.mutate(entry.user_id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Requests History */}
      {requests.filter(r => r.status !== 'pending').length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Request History</h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {requests.filter(r => r.status !== 'pending').map(req => (
              <div key={req.id} className="flex items-center justify-between gap-3 bg-white/3 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-400">{req.username}</p>
                <Badge
                  variant="outline"
                  className={req.status === 'approved'
                    ? 'border-red-500/30 text-red-400 text-xs'
                    : 'border-red-500/30 text-red-400 text-xs'
                  }
                >
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
