import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Award, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ClaimedUsername {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  uid_number: number;
}

interface ApprovedAliasRequest {
  id: string;
  requested_alias: string;
  requester_username: string;
  requester_display_name: string | null;
  responded_at: string;
}

export function ClaimedUsernamesSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [rareUsers, setRareUsers] = useState<ClaimedUsername[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ApprovedAliasRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rare users (low UID numbers = early adopters)
        const { data: rareUsersData } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, uid_number')
          .order('uid_number', { ascending: true })
          .limit(20);

        if (rareUsersData) {
          setRareUsers(rareUsersData);
        }

        // Fetch approved alias requests
        const { data: requestsData } = await supabase
          .from('alias_requests')
          .select('id, requested_alias, requester_id, responded_at')
          .eq('status', 'approved')
          .order('responded_at', { ascending: false })
          .limit(20);

        if (requestsData && requestsData.length > 0) {
          // Fetch requester profiles
          const requesterIds = requestsData.map(r => r.requester_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, display_name')
            .in('user_id', requesterIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          const enrichedRequests: ApprovedAliasRequest[] = requestsData.map(r => ({
            id: r.id,
            requested_alias: r.requested_alias,
            requester_username: profileMap.get(r.requester_id)?.username || 'Unknown',
            requester_display_name: profileMap.get(r.requester_id)?.display_name || null,
            responded_at: r.responded_at || '',
          }));

          setApprovedRequests(enrichedRequests);
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-card/90 backdrop-blur-sm border border-border rounded-r-lg p-2 hover:bg-secondary/50 transition-colors"
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-card/95 backdrop-blur-xl border-r border-border z-40 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-bold gradient-text">UserVault Highlights</h2>
              <p className="text-xs text-muted-foreground mt-1">Rare users & claimed usernames</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Rare Users Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Early Adopters</h3>
                    </div>
                    <div className="space-y-2">
                      {rareUsers.slice(0, 10).map((user) => (
                        <Link
                          key={user.id}
                          to={`/${user.username}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-secondary/50 overflow-hidden flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              @{user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              UID #{user.uid_number}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Claimed Usernames Section */}
                  {approvedRequests.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Recently Claimed</h3>
                      </div>
                      <div className="space-y-2">
                        {approvedRequests.map((request) => (
                          <Link
                            key={request.id}
                            to={`/${request.requester_username}`}
                            className="block p-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-primary">
                                @{request.requested_alias}
                              </span>
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                @{request.requester_username}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(request.responded_at).toLocaleDateString()}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
