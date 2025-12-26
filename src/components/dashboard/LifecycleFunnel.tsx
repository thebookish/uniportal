import { useLifecycleStats } from '@/hooks/useLifecycleStats';
import { cn } from '@/lib/utils';

export function LifecycleFunnel() {
  const { stages, loading } = useLifecycleStats();

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-1/3" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...stages.map(s => s.count), 1);
  const stageColors: Record<string, string> = {
    lead: '#6B7280',
    application: '#3B82F6',
    offer: '#8B5CF6',
    acceptance: '#EC4899',
    enrollment: '#F59E0B',
    onboarding: '#10B981',
    active: '#39FF14',
    at_risk: '#FFB800',
    retained: '#00D9FF',
    dropped: '#FF2E63'
  };

  const stageLabels: Record<string, string> = {
    lead: 'Lead',
    application: 'Application',
    offer: 'Offer',
    acceptance: 'Acceptance',
    enrollment: 'Enrollment',
    onboarding: 'Onboarding',
    active: 'Active',
    at_risk: 'At-Risk',
    retained: 'Retained',
    dropped: 'Dropped'
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Student Lifecycle Funnel</h3>
        <button className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
          View Details →
        </button>
      </div>

      <div className="space-y-3">
        {stages.slice(0, 8).map((stage, index) => {
          const width = (stage.count / maxCount) * 100;
          const prevStage = stages[index - 1];
          const dropoff = prevStage && prevStage.count > 0 ? ((prevStage.count - stage.count) / prevStage.count) * 100 : 0;

          return (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-medium">{stageLabels[stage.stage]}</span>
                <div className="flex items-center gap-3">
                  <span className="metric-number text-white">{stage.count.toLocaleString()}</span>
                  {dropoff > 0 && (
                    <span className="text-xs text-red-400">
                      -{dropoff.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden group cursor-pointer hover:bg-white/10 transition-colors">
                <div
                  className={cn(
                    "h-full rounded-lg transition-all duration-1000 flex items-center px-3",
                    "hover:brightness-110"
                  )}
                  style={{
                    width: `${width}%`,
                    backgroundColor: stageColors[stage.stage],
                    boxShadow: `0 0 20px ${stageColors[stage.stage]}40`
                  }}
                >
                  <span className="text-xs font-medium text-white/90">
                    {stages[0].count > 0 ? ((stage.count / stages[0].count) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold metric-number text-green-400">
              {stages[0].count > 0 ? ((stages.find(s => s.stage === 'retained')?.count || 0) / stages[0].count * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Retention Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold metric-number text-amber-400">
              {stages.find(s => s.stage === 'active')?.count ? 
                ((stages.find(s => s.stage === 'at_risk')?.count || 0) / stages.find(s => s.stage === 'active')!.count * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">At-Risk Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold metric-number text-red-400">
              {stages[0].count > 0 ? ((stages.find(s => s.stage === 'dropped')?.count || 0) / stages[0].count * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Dropout Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
