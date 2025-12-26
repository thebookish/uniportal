import { Search, Bell, Command, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onSearchOpen: () => void;
  onNotificationsOpen: () => void;
  onMenuClick: () => void;
}

export function Header({ onSearchOpen, onNotificationsOpen, onMenuClick }: HeaderProps) {
  const { alerts } = useAIAlerts();
  const { profile, signOut } = useAuth();
  const unreadCount = alerts.filter(a => !a.read).length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-14 md:h-16 border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 sticky top-0 z-50">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-400" />
      </button>

      <div className="flex-1 max-w-2xl mx-2 md:mx-0">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:border-orange-500/30 hover:text-white transition-all duration-200 group"
        >
          <Search className="w-3 md:w-4 h-3 md:h-4" />
          <span className="text-xs md:text-sm hidden sm:inline">Search students, programs, reports...</span>
          <span className="text-xs md:text-sm sm:hidden">Search...</span>
          <div className="ml-auto hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-6">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/5 h-8 w-8 md:h-10 md:w-10"
          onClick={onNotificationsOpen}
        >
          <Bell className="w-4 md:w-5 h-4 md:h-5 text-gray-400" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center p-0 bg-crimson-500 text-white text-[10px] md:text-xs border-2 border-[#1a1f2e] pulse-alert">
              {unreadCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 md:gap-3 hover:bg-white/5 rounded-lg px-2 md:px-3 py-1.5 md:py-2 transition-colors">
              <Avatar className="w-7 h-7 md:w-8 md:h-8 border-2 border-orange-500/30">
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs md:text-sm font-medium">
                  {profile ? getInitials(profile.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-xs md:text-sm font-medium text-white">{profile?.name || 'User'}</p>
                <p className="text-[10px] md:text-xs text-gray-400">{profile?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 md:w-56 glass-card border-white/10">
            <DropdownMenuLabel className="text-gray-300">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-white/5">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-white/5">
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={() => signOut()}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
