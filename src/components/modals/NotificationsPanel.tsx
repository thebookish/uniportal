import { X, AlertCircle, AlertTriangle, Info, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertClick: (alertId: string, studentId: string) => void;
}

export function NotificationsPanel({ isOpen, onClose, onAlertClick }: NotificationsPanelProps) {
  const { alerts, markAsRead } = useAIAlerts();

  if (!isOpen) return null;

  const severityConfig = {
    critical: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    },
    info: {
      icon: Info,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30'
    }
  };

  const unreadAlerts = alerts.filter(a => !a.read);
  const readAlerts = alerts.filter(a => a.read);

  const handleMarkAllRead = async () => {
    for (const alert of unreadAlerts) {
      await markAsRead(alert.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md bg-[#1a1f2e] border-l border-white/10 h-full overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">AI Notifications</h2>
            {unreadAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                {unreadAlerts.length} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {unreadAlerts.length > 0 && (
          <div className="px-4 py-2 border-b border-white/10 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-orange-400 hover:text-orange-300"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all as read
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {unreadAlerts.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">New Alerts</p>
              <div className="space-y-3">
                {unreadAlerts.map((alert) => {
                  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
                  const Icon = config.icon;

                  return (
                    <button
                      key={alert.id}
                      onClick={() => {
                        markAsRead(alert.id);
                        if (alert.student_id) {
                          onAlertClick(alert.id, alert.student_id);
                        }
                      }}
                      className={cn(
                        "w-full glass-card p-4 border text-left hover:scale-[1.01] transition-all",
                        config.border
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", config.bg)}>
                          <Icon className={cn("w-4 h-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-white text-sm">{alert.title}</h4>
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="ai-badge">
                              <Sparkles className="w-3 h-3" />
                              AI Insight
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {readAlerts.length > 0 && (
            <div className="p-4 border-t border-white/10">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Earlier</p>
              <div className="space-y-2">
                {readAlerts.slice(0, 10).map((alert) => {
                  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
                  const Icon = config.icon;

                  return (
                    <button
                      key={alert.id}
                      onClick={() => {
                        if (alert.student_id) {
                          onAlertClick(alert.id, alert.student_id);
                        }
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left opacity-70"
                    >
                      <div className={cn("p-1.5 rounded-lg", config.bg)}>
                        <Icon className={cn("w-3 h-3", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{alert.title}</h4>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {alerts.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1">AI alerts will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
