import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metric: {
    label: string;
    value: number;
    change: number;
    trend: string;
  };
  delay?: number;
}

export function MetricCard({ metric, delay = 0 }: MetricCardProps) {
  const isPositive = metric.trend === 'up';
  const isNegative = metric.trend === 'down';
  const isNeutral = metric.trend === 'neutral';

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  return (
    <div 
      className="glass-card p-6 hover:scale-[1.02] transition-all duration-200 stagger-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-gray-400 font-medium">{metric.label}</p>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
          isPositive && "text-green-400 bg-green-500/10",
          isNegative && "text-red-400 bg-red-500/10",
          isNeutral && "text-gray-400 bg-gray-500/10"
        )}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(metric.change)}%</span>
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-bold metric-number text-white">
          {metric.value.toLocaleString()}
        </h3>
        {metric.label.includes('Rate') && (
          <span className="text-xl text-gray-400">%</span>
        )}
      </div>
      
      <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isPositive && "bg-gradient-to-r from-green-500 to-emerald-400",
            isNegative && "bg-gradient-to-r from-red-500 to-rose-400",
            isNeutral && "bg-gradient-to-r from-gray-500 to-gray-400"
          )}
          style={{ width: `${Math.min(Math.abs(metric.change) * 5, 100)}%` }}
        />
      </div>
    </div>
  );
}
