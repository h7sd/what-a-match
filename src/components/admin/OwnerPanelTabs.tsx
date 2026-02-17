// FIXED: Created organized Owner Panel with tabbed navigation
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  MessageSquare,
  Award,
  Sparkles,
  FileText,
  ShoppingBag,
  Puzzle,
  Shield
} from 'lucide-react';
import { AdminUserManager } from './AdminUserManager';
import { AdminAccountLookup } from './AdminAccountLookup';
import { AdminUIDManager } from './AdminUIDManager';
import { UserBanManager } from './UserBanManager';
import { AdminPremiumManager } from './AdminPremiumManager';
import { SupporterManager } from './SupporterManager';
import { AdminSupportTickets } from './AdminSupportTickets';
import { AdminLiveChat } from './AdminLiveChat';
import { AdminNotificationSender } from './AdminNotificationSender';
import { AdminDiscordSender } from './AdminDiscordSender';
import { AdminBadgeManager } from './AdminBadgeManager';
import { LimitedBadgeAssigner } from './LimitedBadgeAssigner';
import { AllBadgeAssigner } from './AllBadgeAssigner';
import { AdminBadgeRemover } from './AdminBadgeRemover';
import { AdminEarlyBadgeCounter } from './AdminEarlyBadgeCounter';
import { AdminEventController } from './AdminEventController';
import { AdminMarketplaceManager } from './AdminMarketplaceManager';
import { AdminChangelogManager } from './AdminChangelogManager';
import { AdminPromoCodeManager } from './AdminPromoCodeManager';
import { AdminPurchaseHistory } from './AdminPurchaseHistory';
import { AdminBotNotificationTester } from './AdminBotNotificationTester';

export function OwnerPanelTabs() {
  const [activeSubTab, setActiveSubTab] = useState('users');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Owner Panel
        </h1>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="w-full flex flex-wrap justify-start gap-2 bg-white/5 p-2 h-auto">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Support</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>Badges</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Events</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Financial</span>
          </TabsTrigger>
          <TabsTrigger value="dev" className="flex items-center gap-2">
            <Puzzle className="w-4 h-4" />
            <span>Developer</span>
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                User Manager
              </h3>
              <AdminUserManager />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Account Lookup</h3>
              <AdminAccountLookup />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <UserBanManager />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <AdminUIDManager />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <AdminPremiumManager />
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Supporter Management</h3>
            <SupporterManager />
          </div>
        </TabsContent>

        {/* Support & Communication Tab */}
        <TabsContent value="support" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 h-[600px] flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Support Tickets
              </h3>
              <AdminSupportTickets />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 h-[600px] flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Live Chat</h3>
              <AdminLiveChat />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <AdminNotificationSender />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <AdminDiscordSender />
            </div>
          </div>
        </TabsContent>

        {/* Badge Management Tab */}
        <TabsContent value="badges" className="mt-6 space-y-4">
          <div className="rounded-xl border border-primary/10 bg-card/40 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Badge Manager
            </h3>
            <AdminBadgeManager />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5">
              <LimitedBadgeAssigner />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5">
              <AllBadgeAssigner />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5">
              <AdminBadgeRemover />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5">
              <AdminEarlyBadgeCounter />
            </div>
          </div>
        </TabsContent>

        {/* Events & Features Tab */}
        <TabsContent value="events" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Event Controller
              </h3>
              <AdminEventController />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Marketplace Manager</h3>
              <AdminMarketplaceManager />
            </div>
          </div>
        </TabsContent>

        {/* Content Management Tab */}
        <TabsContent value="content" className="mt-6">
          <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Changelog Manager
            </h3>
            <AdminChangelogManager />
          </div>
        </TabsContent>

        {/* Financial Management Tab */}
        <TabsContent value="financial" className="mt-6 space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Promo Code Manager
            </h3>
            <AdminPromoCodeManager />
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
            </div>
            <AdminPurchaseHistory />
          </div>
        </TabsContent>

        {/* Developer Tools Tab */}
        <TabsContent value="dev" className="mt-6">
          <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-primary" />
              Bot Notification Tester
            </h3>
            <AdminBotNotificationTester />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
