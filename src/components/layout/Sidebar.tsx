import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  BarChart3, 
  Workflow, 
  Settings,
  Sparkles,
  X,
  Menu,
  UserCheck,
  FileText,
  ClipboardList,
  Inbox,
  Target,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const allNavigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admissions', 'student_success', 'academic_manager'] },
  { id: 'student-success', label: 'Risk & Intervention', icon: UserCheck, roles: ['super_admin', 'student_success', 'admissions'] },
  { id: 'ai-intelligence', label: 'Risk Intelligence', icon: Sparkles, roles: ['super_admin', 'admissions', 'student_success'] },
  { id: 'admissions', label: 'Admissions', icon: FileText, roles: ['super_admin', 'admissions'] },
  { id: 'lead-inbox', label: 'Lead Inbox', icon: Inbox, roles: ['super_admin', 'admissions'] },
  { id: 'students', label: 'Student Registry', icon: Users, roles: ['super_admin', 'admissions', 'student_success', 'academic_manager'] },
  { id: 'programs', label: 'Programs', icon: GraduationCap, roles: ['super_admin', 'admissions', 'academic_manager'] },
  { id: 'course-fit', label: 'Course Fit', icon: Target, roles: ['super_admin', 'admissions', 'academic_manager'] },
  { id: 'onboarding', label: 'Onboarding', icon: ClipboardList, roles: ['super_admin', 'admissions', 'student_success'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, roles: ['super_admin', 'admissions', 'student_success'] },
  { id: 'reports', label: 'Reports (Growth)', icon: BarChart3, roles: ['super_admin', 'academic_manager'] },
  { id: 'automation', label: 'Automation', icon: Workflow, roles: ['super_admin', 'admissions'] },
  { id: 'integrations', label: 'Integrations', icon: Link2, roles: ['super_admin'] },
  { id: 'counselors', label: 'Counselors', icon: Users, roles: ['super_admin', 'admissions'] },
];

export function Sidebar({ activeView, onViewChange, isOpen, onClose }: SidebarProps) {
  const { profile } = useAuth();
  const userRole = profile?.role || 'super_admin';

  const navigationItems = allNavigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-[#1a1f2e] border-r border-white/10 flex flex-col transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 md:w-10 h-8 md:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="w-5 md:w-6 h-5 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-white">WorldLynk</h1>
                <p className="text-xs text-gray-400">University Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/30 glow-orange" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Settings */}
        <div className="p-3 md:p-4 border-t border-white/10">
          <button
            onClick={() => handleNavClick('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all duration-200",
              activeView === 'settings'
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
