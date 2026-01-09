import { useStudents } from '@/hooks/useStudents';
import { AlertTriangle, Clock, Shield, TrendingDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstitutionalRiskBannerProps {
  onViewDetails?: () => void;
}

export function InstitutionalRiskBanner({ onViewDetails }: InstitutionalRiskBannerProps = {}) {
  const { students } = useStudents();

  const highRisk = students.filter(s => s.risk_score >= 70).length;
  const mediumRisk = students.filter(s => s.risk_score >= 40 && s.risk_score < 70).length;
  const lowRisk = students.filter(s => s.risk_score < 40).length;

  const studentsNearBreach = students.filter(s => {
    const daysSinceActivity = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
    return s.risk_score >= 60 || daysSinceActivity >= 5;
  });

  const nextBreachDays = studentsNearBreach.length > 0 
    ? Math.max(1, Math.min(...studentsNearBreach.map(s => {
        const daysSinceActivity = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, 14 - daysSinceActivity);
      })))
    : 30;

  return (
    <div className="glass-card p-3 md:p-4 mb-4 md:mb-6 border border-white/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-semibold text-white">Institutional Risk Status</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs md:text-sm text-gray-300">
              <span className="font-bold text-red-400">{highRisk}</span> High Risk
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs md:text-sm text-gray-300">
              <span className="font-bold text-amber-400">{mediumRisk}</span> Medium Risk
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs md:text-sm text-gray-300">
              <span className="font-bold text-green-400">{lowRisk}</span> Low Risk
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-xs md:text-sm text-red-400 font-medium">
              Next predicted breach: <span className="font-bold">{nextBreachDays} days</span>
            </span>
          </div>

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex items-center gap-1 text-xs md:text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
