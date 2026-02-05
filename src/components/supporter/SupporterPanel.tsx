import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, HeadphonesIcon } from 'lucide-react';
import { AdminSupportTickets } from '@/components/admin/AdminSupportTickets';
import { AdminLiveChat } from '@/components/admin/AdminLiveChat';

export function SupporterPanel() {
  const [activeTab, setActiveTab] = useState('tickets');

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
          <HeadphonesIcon className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Supporter Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage support tickets and live chat conversations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-card/50 border border-border/50">
          <TabsTrigger 
            value="tickets" 
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger 
            value="chat"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            <HeadphonesIcon className="w-4 h-4 mr-2" />
            Live Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="glass-card p-6">
            <AdminSupportTickets />
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="glass-card p-6">
            <AdminLiveChat />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
