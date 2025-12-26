import { MetricCard } from '../dashboard/MetricCard';
import { AIAlertCard } from '../dashboard/AIAlertCard';
import { LifecycleFunnel } from '../dashboard/LifecycleFunnel';
import { InstitutionalRiskBanner } from '../dashboard/InstitutionalRiskBanner';
import { TopPriorityToday } from '../dashboard/TopPriorityToday';
import { useMetrics } from '@/hooks/useMetrics';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { usePrograms } from '@/hooks/usePrograms';
import { useStudents } from '@/hooks/useStudents';
import { useLifecycleStats } from '@/hooks/useLifecycleStats';
import { Sparkles, Loader2, TrendingUp, TrendingDown, Users, Clock, Target, AlertTriangle, Shield, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
  onAlertClick: (alertId: string) => void;
  onStudentClick?: (studentId: string) => void;
}

export function DashboardView({ onAlertClick, onStudentClick }: DashboardViewProps) {
  const { metrics, loading: metricsLoading } = useMetrics();
  const { alerts, loading: alertsLoading } = useAIAlerts();
  const { programs, loading: programsLoading } = usePrograms();
  const { students } = useStudents();
  const { stages } = useLifecycleStats();

  const totalLeads = stages.find(s => s.stage === 'lead')?.count || 0;
  const totalEnrolled = stages.find(s => s.stage === 'active')?.count || 0;
  const atRiskCount = students.filter(s => s.risk_score >= 70).length;
  const lowEngagementCount = students.filter(s => s.engagement_score < 40).length;

  const studentsNearBreach7 = students.filter(s => {
    const daysSinceActivity = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
    return s.risk_score >= 60 && daysSinceActivity >= 7;
  }).length;

  const studentsNearBreach14 = students.filter(s => {
    const daysSinceActivity = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
    return s.risk_score >= 50 && daysSinceActivity >= 5;
  }).length;

  const unresolvedObligations = students.filter(s => s.risk_score >= 50 || s.engagement_score < 40).length;
  const activeInterventions = alerts.filter(a => !a.read).length;
  const avgTimeToResolution = '3.2 days';

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <InstitutionalRiskBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Risk Command Center</h1>
          <p className="text-sm md:text-base text-gray-400">Student risk monitoring and compliance intelligence</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30">
          <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-orange-400" />
          <span className="text-xs md:text-sm font-medium text-orange-400">Risk AI Active • {students.length} Monitored</span>
        </div>
      </div>

      {onStudentClick && <TopPriorityToday onStudentClick={onStudentClick} />}

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Near Breach (7 days)</span>
          </div>
          <p className="text-2xl font-bold metric-number text-red-400">{studentsNearBreach7}</p>
          <p className="text-xs text-gray-500 mt-1">Immediate action required</p>
        </div>

        <div className="glass-card p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-400">Unresolved Obligations</span>
          </div>
          <p className="text-2xl font-bold metric-number text-amber-400">{unresolvedObligations}</p>
          <p className="text-xs text-gray-500 mt-1">Monitoring required</p>
        </div>

        <div className="glass-card p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Active Interventions</span>
          </div>
          <p className="text-2xl font-bold metric-number text-blue-400">{activeInterventions}</p>
          <p className="text-xs text-gray-500 mt-1">In progress</p>
        </div>

        <div className="glass-card p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Avg Time to Resolution</span>
          </div>
          <p className="text-2xl font-bold metric-number text-green-400">{avgTimeToResolution}</p>
          <p className="text-xs text-gray-500 mt-1">Risk resolved</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* AI Intelligence Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-orange-400" />
              AI Intelligence Feed
            </h2>
            <button className="text-xs md:text-sm text-orange-400 hover:text-orange-300 transition-colors">
              View All →
            </button>
          </div>
          
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert) => (
                <AIAlertCard 
                  key={alert.id} 
                  alert={{
                    id: alert.id,
                    severity: alert.severity as 'critical' | 'warning' | 'info',
                    title: alert.title,
                    description: alert.description,
                    studentId: alert.student_id,
                    studentName: alert.students?.name || 'Unknown',
                    timestamp: new Date(alert.created_at),
                    recommendations: alert.recommendations || [],
                    read: alert.read
                  }}
                  onClick={() => onAlertClick(alert.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Risk Summary */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Risk Summary</h2>
          
          <div className="glass-card p-4 md:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs md:text-sm text-gray-400">Critical Risk Students</p>
                {atRiskCount > 0 && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-1" />Urgent
                  </Badge>
                )}
              </div>
              <p className={cn("text-2xl md:text-3xl font-bold metric-number", atRiskCount > 0 ? "text-red-400" : "text-white")}>{atRiskCount}</p>
              <p className="text-xs text-gray-500 mt-1">Immediate intervention required</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs md:text-sm text-gray-400">Monitoring Required</p>
                {lowEngagementCount > 0 && (
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                    <Clock className="w-3 h-3 mr-1" />Watch
                  </Badge>
                )}
              </div>
              <p className={cn("text-2xl md:text-3xl font-bold metric-number", lowEngagementCount > 0 ? "text-amber-400" : "text-white")}>{lowEngagementCount}</p>
              <p className="text-xs text-gray-500 mt-1">Engagement below threshold</p>
            </div>

            <div>
              <p className="text-xs md:text-sm text-gray-400 mb-1">Compliance Breach (14 days)</p>
              <p className={cn("text-2xl md:text-3xl font-bold metric-number", studentsNearBreach14 > 0 ? "text-amber-400" : "text-white")}>{studentsNearBreach14}</p>
              <p className="text-xs text-gray-500 mt-1">Approaching deadline</p>
            </div>

            <div>
              <p className="text-xs md:text-sm text-gray-400 mb-1">Active Alerts</p>
              <p className="text-2xl md:text-3xl font-bold metric-number text-orange-400">{alerts.filter(a => !a.read).length}</p>
              <p className="text-xs text-gray-500 mt-1">Unread AI notifications</p>
            </div>
          </div>

          {programsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="glass-card p-4 md:p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Top Programs</h3>
              <div className="space-y-3">
                {programs.slice(0, 3).map((program) => (
                  <div key={program.id}>
                    <div className="flex items-center justify-between text-xs md:text-sm mb-1">
                      <span className="text-gray-300 truncate pr-2">{program.name}</span>
                      <span className="metric-number text-white whitespace-nowrap">
                        {program.enrolled}/{program.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                        style={{ width: `${(program.enrolled / program.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Funnel */}
      <LifecycleFunnel />
    </div>
  );
}
