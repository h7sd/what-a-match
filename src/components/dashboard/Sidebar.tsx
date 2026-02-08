import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Palette,
  Link2,
  Award,
  Settings,
  LogOut,
  Eye,
  Crown,
  ShoppingBag,
  Bell,
  Shield,
  HeadphonesIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import Dock, { DockItemConfig } from './Dock';

interface SidebarProps {
  username: string;
  onSignOut: () => void;
  isPremium?: boolean;
  isAdmin?: boolean;
  isSupporter?: boolean;
}

export function Sidebar({ username, onSignOut, isPremium = false, isAdmin = false, isSupporter = false }: SidebarProps) {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const getCurrentTab = () => {
    const hash = location.hash.replace('#', '');
    return hash || 'overview';
  };

  const currentTab = getCurrentTab();

  const baseNavItems = [
    { icon: LayoutDashboard, label: 'Overview', tab: 'overview' },
    { icon: User, label: 'Profile', tab: 'profile' },
    { icon: Palette, label: 'Appearance', tab: 'appearance' },
    { icon: Link2, label: 'Links', tab: 'links' },
    { icon: Award, label: 'Badges', tab: 'badges' },
    { icon: Bell, label: 'Notifications', tab: 'notifications' },
    { icon: ShoppingBag, label: 'Marketplace', tab: 'marketplace' },
    { icon: Settings, label: 'Settings', tab: 'settings' },
  ];

  const navItems = [...baseNavItems];
  if (isSupporter) {
    navItems.push({ icon: HeadphonesIcon, label: 'Supporter', tab: 'supporter' });
  }
  if (isAdmin) {
    navItems.push({ icon: Shield, label: 'Owner', tab: 'owner' });
  }

  const dockItems: DockItemConfig[] = navItems.map((item) => {
    const Icon = item.icon;
    const isActive = currentTab === item.tab;

    return {
      icon: <Icon size={20} />,
      label: item.label,
      onClick: () => {
        if (location.pathname !== '/dashboard') {
          window.location.href = `/dashboard#${item.tab}`;
        } else {
          window.location.hash = item.tab;
        }
      },
      className: isActive ? 'active' : '',
    };
  });

  return (
    <aside className="w-24 min-h-screen bg-background/50 backdrop-blur-sm border-r border-border/50 flex flex-col items-center">
      <div className="p-4 border-b border-border/50 w-full flex justify-center">
        <Link to="/" className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#00D9A5] flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">UV</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 w-full flex items-center justify-center py-8">
        <Dock
          items={dockItems}
          panelWidth={80}
          baseItemSize={48}
          magnification={64}
          distance={120}
        />
      </nav>

      <div className="p-4 border-t border-border/50 w-full space-y-3 flex flex-col items-center">
        {isPremium && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl border border-[#00B4D8]/30 hover:bg-[#00B4D8]/10 hover:border-[#00B4D8]/60"
          asChild
        >
          <Link to={`/${username}`} target="_blank">
            <Eye className="w-5 h-5 text-[#00B4D8]" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl hover:bg-destructive/10 hover:border-destructive/30"
          onClick={onSignOut}
        >
          <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </aside>
  );
}
