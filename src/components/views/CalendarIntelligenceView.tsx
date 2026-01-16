import { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Users,
  TrendingDown,
  FileText,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useCalendarRiskSummary,
  useTimetableFeasibility,
  useCalendarConflicts,
  useViabilityRisks,
  usePilotReport,
  useAnalyzeTimetable,
} from '@/hooks/useCalendarIntelligence';
import { StudentCalendarDetailPanel } from '@/components/calendar/StudentCalendarDetailPanel';

export function CalendarIntelligenceView() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'conflicts' | 'report'>('overview');

  const { summary, loading: summaryLoading, refetch: refetchSummary } = useCalendarRiskSummary();
  const { feasibilityList, loading: feasibilityLoading, refetch: refetchFeasibility } = useTimetableFeasibility();
  const { conflicts, loading: conflictsLoading, refetch: refetchConflicts } = useCalendarConflicts();
  const { risks, loading: risksLoading, refetch: refetchRisks } = useViabilityRisks();
  const { report, loading: reportLoading, fetchReport } = usePilotReport();
  const { analyzeTimetable, analyzing } = useAnalyzeTimetable();

  const handleRefreshAll = async () => {
    await analyzeTimetable();
    refetchSummary();
    refetchFeasibility();
    refetchConflicts();
    refetchRisks();
  };

  const handleGenerateReport = () => {
    fetchReport();
  };

  const handleExportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-intelligence-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Risk Overview', icon: TrendingDown },
    { id: 'students', label: 'Student Detail', icon: Users },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
    { id: 'report', label: 'Pilot Report', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">
            Calendar & Attendance Intelligence
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Predictive feasibility intelligence for student timetables
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefreshAll}
            disabled={analyzing}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Analyze All
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors',
              activeTab === tab.id
                ? 'bg-white/10 text-white border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Students Analyzed"
              value={summary?.total_students_analyzed || 0}
              icon={Users}
              loading={summaryLoading}
            />
            <SummaryCard
              title="Strained Timetables"
              value={`${summary?.strained_timetables_percentage || 0}%`}
              subtitle={`${summary?.strained_timetables_count || 0} students`}
              icon={Clock}
              variant="warning"
              loading={summaryLoading}
            />
            <SummaryCard
              title="At Risk (2-4 weeks)"
              value={`${summary?.at_risk_percentage || 0}%`}
              subtitle={`${summary?.at_risk_count || 0} students`}
              icon={AlertTriangle}
              variant="critical"
              loading={summaryLoading}
            />
            <SummaryCard
              title="Avg Feasibility Score"
              value={summary?.average_feasibility_score || 0}
              icon={Calendar}
              variant={
                (summary?.average_feasibility_score || 0) >= 85
                  ? 'success'
                  : (summary?.average_feasibility_score || 0) >= 60
                  ? 'warning'
                  : 'critical'
              }
              loading={summaryLoading}
            />
          </div>

          {/* Viability Risks */}
          <div className="bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Attendance Viability Risks</h2>
                <Badge className="bg-amber-500/20 text-amber-400">{risks.length}</Badge>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {risksLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                </div>
              ) : risks.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No viability risks detected
                </div>
              ) : (
                risks.slice(0, 5).map((risk: any) => (
                  <div
                    key={risk.id}
                    className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedStudentId(risk.student_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{risk.students?.name}</p>
                        <p className="text-sm text-gray-400">{risk.students?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(risk.reasons || []).slice(0, 2).map((reason: string, i: number) => (
                            <Badge key={i} className="bg-white/5 text-gray-300 text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={cn(
                            risk.confidence === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : risk.confidence === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          )}
                        >
                          {risk.weeks_to_risk} week{risk.weeks_to_risk !== 1 ? 's' : ''} to risk
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{risk.confidence} confidence</p>
                      </div>
                    </div>
                    {risk.recommendation && (
                      <p className="text-sm text-cyan-400 mt-2 italic">
                        → {risk.recommendation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student List */}
          <div className="bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Timetable Feasibility</h2>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {feasibilityLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                </div>
              ) : feasibilityList.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No feasibility data. Click "Analyze All" to start.
                </div>
              ) : (
                feasibilityList.map((item: any) => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 hover:bg-white/5 cursor-pointer transition-colors',
                      selectedStudentId === item.student_id && 'bg-cyan-500/10'
                    )}
                    onClick={() => setSelectedStudentId(item.student_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{item.students?.name}</p>
                        <p className="text-sm text-gray-400">{item.students?.programs?.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <FeasibilityScoreBadge
                          score={item.feasibility_score}
                          band={item.score_band}
                        />
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Student Detail */}
          {selectedStudentId ? (
            <StudentCalendarDetailPanel
              studentId={selectedStudentId}
              onClose={() => setSelectedStudentId(null)}
            />
          ) : (
            <div className="bg-[#0D1117] rounded-xl border border-white/10 flex items-center justify-center p-8">
              <p className="text-gray-400">Select a student to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Conflicts Tab */}
      {activeTab === 'conflicts' && (
        <div className="bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Detected Conflicts</h2>
              <Badge className="bg-red-500/20 text-red-400">{conflicts.length}</Badge>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {conflictsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
              </div>
            ) : conflicts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                No conflicts detected
              </div>
            ) : (
              conflicts.map((conflict: any) => (
                <div
                  key={conflict.id}
                  className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedStudentId(conflict.student_id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ConflictTypeBadge type={conflict.conflict_type} />
                        <Badge
                          className={cn(
                            'capitalize',
                            conflict.severity === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : conflict.severity === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          )}
                        >
                          {conflict.severity}
                        </Badge>
                      </div>
                      <p className="font-medium text-white">{conflict.students?.name}</p>
                      <p className="text-sm text-gray-300 mt-1">{conflict.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-400">{conflict.day}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Pilot Reporting Output</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
              >
                {reportLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </Button>
              {report && (
                <Button
                  onClick={handleExportReport}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              )}
            </div>
          </div>

          {report ? (
            <div className="space-y-6">
              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportMetricCard
                  label="Students Analyzed"
                  value={report.total_students_analyzed}
                />
                <ReportMetricCard
                  label="Unfeasible Timetables"
                  value={`${report.unfeasible_timetables_count} (${report.unfeasible_timetables_percentage}%)`}
                  variant="critical"
                />
                <ReportMetricCard
                  label="Flagged Before Drop"
                  value={report.flagged_before_attendance_drop}
                  variant="warning"
                />
                <ReportMetricCard
                  label="Avg Early Warning"
                  value={`${report.average_weeks_early_warning} weeks`}
                  variant="success"
                />
              </div>

              {/* Summary Insights */}
              <div className="bg-[#0D1117] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
                <ul className="space-y-2">
                  {report.summary_insights?.map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Anonymized Examples */}
              <div className="bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Anonymized Examples</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Case ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Feasibility</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Conflicts</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Primary Issue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Weeks to Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {report.anonymized_examples?.map((example: any) => (
                        <tr key={example.case_id} className="hover:bg-white/5">
                          <td className="px-4 py-3 font-mono text-sm text-cyan-400">{example.case_id}</td>
                          <td className="px-4 py-3">
                            <FeasibilityScoreBadge
                              score={example.feasibility_score}
                              band={example.score_band}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={cn(
                                'capitalize',
                                example.score_band === 'at_risk'
                                  ? 'bg-red-500/20 text-red-400'
                                  : example.score_band === 'strained'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-green-500/20 text-green-400'
                              )}
                            >
                              {example.score_band.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-white">{example.conflicts_count}</td>
                          <td className="px-4 py-3">
                            <ConflictTypeBadge type={example.primary_conflict_type} />
                          </td>
                          <td className="px-4 py-3 text-white">
                            {example.weeks_to_risk > 0 ? `${example.weeks_to_risk} weeks` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conflict Breakdown */}
              {report.conflict_breakdown && report.conflict_breakdown.length > 0 && (
                <div className="bg-[#0D1117] rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Conflict Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {report.conflict_breakdown.map((item: any) => (
                      <div key={item.type} className="bg-white/5 rounded-lg p-4">
                        <ConflictTypeBadge type={item.type} />
                        <p className="text-2xl font-bold text-white mt-2">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Timestamp */}
              <p className="text-xs text-gray-500 text-right">
                Report generated: {new Date(report.report_generated_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="bg-[#0D1117] rounded-xl border border-white/10 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Generate a pilot report to see analysis results
              </p>
              <Button
                onClick={handleGenerateReport}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
              >
                Generate Report
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  variant?: 'default' | 'warning' | 'critical' | 'success';
  loading?: boolean;
}) {
  const variantClasses = {
    default: 'border-white/10',
    warning: 'border-amber-500/30',
    critical: 'border-red-500/30',
    success: 'border-green-500/30',
  };

  const iconClasses = {
    default: 'text-cyan-400',
    warning: 'text-amber-400',
    critical: 'text-red-400',
    success: 'text-green-400',
  };

  return (
    <div className={cn('bg-[#0D1117] rounded-xl border p-4', variantClasses[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mt-2" />
          ) : (
            <>
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </>
          )}
        </div>
        <Icon className={cn('w-5 h-5', iconClasses[variant])} />
      </div>
    </div>
  );
}

function FeasibilityScoreBadge({
  score,
  band,
}: {
  score: number;
  band: string;
}) {
  const colors =
    band === 'feasible'
      ? 'bg-green-500/20 text-green-400'
      : band === 'strained'
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-red-500/20 text-red-400';

  return (
    <Badge className={cn('font-mono', colors)}>
      {score}/100
    </Badge>
  );
}

function ConflictTypeBadge({ type }: { type: string }) {
  const labels: { [key: string]: string } = {
    class_work_overlap: 'Class-Work Overlap',
    unrealistic_transition: 'No Gap',
    excessive_sessions: 'Back-to-Back',
    day_exceeds_hours: 'Day Overload',
    none: 'None',
  };

  const colors: { [key: string]: string } = {
    class_work_overlap: 'bg-red-500/20 text-red-400',
    unrealistic_transition: 'bg-amber-500/20 text-amber-400',
    excessive_sessions: 'bg-orange-500/20 text-orange-400',
    day_exceeds_hours: 'bg-purple-500/20 text-purple-400',
    none: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <Badge className={cn('text-xs', colors[type] || colors.none)}>
      {labels[type] || type}
    </Badge>
  );
}

function ReportMetricCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  variant?: 'default' | 'warning' | 'critical' | 'success';
}) {
  const variantClasses = {
    default: 'border-white/10',
    warning: 'border-amber-500/30 bg-amber-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
    success: 'border-green-500/30 bg-green-500/5',
  };

  return (
    <div className={cn('bg-[#0D1117] rounded-xl border p-4', variantClasses[variant])}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
