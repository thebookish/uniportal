import { useState } from 'react';
import { Plus, UserPlus, Send, FileText, Sparkles, Workflow, X, GraduationCap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionsPanelProps {
  currentView: string;
  onAddStudent: () => void;
  onSendBroadcast: () => void;
  onCreateRule: () => void;
  onViewAIInsights: () => void;
}

export function QuickActionsPanel({ 
  currentView, 
  onAddStudent, 
  onSendBroadcast, 
  onCreateRule,
  onViewAIInsights 
}: QuickActionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getContextualActions = () => {
    switch (currentView) {
      case 'students':
      case 'admissions':
        return [
          { icon: UserPlus, label: 'Add Student', action: onAddStudent, color: 'bg-blue-500' },
          { icon: Send, label: 'Send Message', action: onSendBroadcast, color: 'bg-green-500' },
          { icon: Sparkles, label: 'AI Insights', action: onViewAIInsights, color: 'bg-purple-500' },
        ];
      case 'communications':
        return [
          { icon: Send, label: 'New Broadcast', action: onSendBroadcast, color: 'bg-green-500' },
          { icon: FileText, label: 'New Template', action: () => {}, color: 'bg-blue-500' },
        ];
      case 'automation':
        return [
          { icon: Workflow, label: 'Create Rule', action: onCreateRule, color: 'bg-purple-500' },
          { icon: AlertTriangle, label: 'View Alerts', action: onViewAIInsights, color: 'bg-amber-500' },
        ];
      case 'programs':
        return [
          { icon: GraduationCap, label: 'Add Program', action: () => {}, color: 'bg-blue-500' },
          { icon: FileText, label: 'Import Programs', action: () => {}, color: 'bg-green-500' },
        ];
      default:
        return [
          { icon: UserPlus, label: 'Add Student', action: onAddStudent, color: 'bg-blue-500' },
          { icon: Send, label: 'Send Message', action: onSendBroadcast, color: 'bg-green-500' },
          { icon: Sparkles, label: 'AI Insights', action: onViewAIInsights, color: 'bg-purple-500' },
          { icon: Workflow, label: 'Create Rule', action: onCreateRule, color: 'bg-amber-500' },
        ];
    }
  };

  const actions = getContextualActions();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className={cn(
        "flex flex-col-reverse items-end gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => {
                action.action();
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105",
                action.color,
                "text-white"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
          isOpen 
            ? "bg-gray-700 rotate-45" 
            : "bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
