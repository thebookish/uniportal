import { AlertTriangle, Info, AlertCircle, Sparkles, ChevronRight, Clock, Target, Shield } from 'lucide-react';
import { AIAlert } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface AIAlertCardProps {
  alert: AIAlert;
  onClick: () => void;
}

export function AIAlertCard({ alert, onClick }: AIAlertCardProps) {
  const severityConfig = {
    critical: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'glow-crimson',
      riskType: 'Compliance Breach Risk',
      consequence: 'Visa escalation imminent'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'glow-amber',
      riskType: 'Attendance Risk',
      consequence: 'Academic warning pending'
    },
    info: {
      icon: Info,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      glow: 'glow-cyan',
      riskType: 'Engagement Risk',
      consequence: 'Monitoring required'
    }
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  const confidence = alert.severity === 'critical' ? 92 : alert.severity === 'warning' ? 78 : 65;
  const daysUntilConsequence = alert.severity === 'critical' ? 3 : alert.severity === 'warning' ? 10 : 21;
  const successProbability = alert.severity === 'critical' ? 67 : alert.severity === 'warning' ? 82 : 91;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full glass-card p-4 border text-left hover:scale-[1.01] transition-all duration-200 group",
        config.border,
        !alert.read && config.glow
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={cn("text-xs", config.bg, config.color, config.border)}>
                  {config.riskType}
                </Badge>
                <Badge className="bg-white/5 text-gray-300 border-white/10 text-xs">
                  {confidence}% confidence
                </Badge>
              </div>
              <h4 className="font-semibold text-white text-sm">{alert.title}</h4>
            </div>
            {!alert.read && (
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
            {alert.description}
          </p>

          <div className="flex items-center gap-3 mb-2 text-xs">
            <span className={cn("flex items-center gap-1", config.color)}>
              <Clock className="w-3 h-3" />
              {config.consequence} in {daysUntilConsequence} days
            </span>
          </div>

          {alert.recommendations && alert.recommendations.length > 0 && (
            <div className="p-2 rounded bg-white/5 mb-2">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-orange-400" />
                Recommended Action ({successProbability}% success rate):
              </p>
              <p className="text-xs text-white">{alert.recommendations[0]}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="ai-badge">
                <Sparkles className="w-3 h-3" />
                AI Risk Analysis
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
              </span>
            </div>
            
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </button>
  );
}
