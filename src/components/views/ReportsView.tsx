import { useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { usePrograms } from '@/hooks/usePrograms';
import { useLifecycleStats } from '@/hooks/useLifecycleStats';
import { BarChart3, Download, FileText, TrendingDown, Users, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ReportsView() {
  const { students, loading: studentsLoading } = useStudents();
  const { programs, loading: programsLoading } = usePrograms();
  const { stages, loading: stagesLoading } = useLifecycleStats();
  const [selectedReport, setSelectedReport] = useState('funnel');

  const loading = studentsLoading || programsLoading || stagesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const dropoutStudents = students.filter(s => s.stage === 'dropped');
  const retainedStudents = students.filter(s => s.stage === 'retained' || s.stage === 'active');

  const countryStats = students.reduce((acc: Record<string, { total: number; enrolled: number }>, student) => {
    if (!acc[student.country]) acc[student.country] = { total: 0, enrolled: 0 };
    acc[student.country].total++;
    if (['active', 'retained', 'enrollment'].includes(student.stage)) {
      acc[student.country].enrolled++;
    }
    return acc;
  }, {});

  const sortedCountries = Object.entries(countryStats)
    .map(([country, stats]) => ({
      country,
      ...stats,
      conversionRate: stats.total > 0 ? (stats.enrolled / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const stageLabels: Record<string, string> = {
    lead: 'Lead', application: 'Application', offer: 'Offer', acceptance: 'Acceptance',
    enrollment: 'Enrollment', onboarding: 'Onboarding', active: 'Active',
    at_risk: 'At-Risk', retained: 'Retained', dropped: 'Dropped'
  };

  async function exportReport() {
    const reportData = {
      generatedAt: new Date().toISOString(),
      type: selectedReport,
      stages,
      countries: sortedCountries,
      programs: programs.map(p => ({ name: p.name, enrolled: p.enrolled, capacity: p.capacity }))
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Reports (Growth)</h1>
          <p className="text-sm md:text-base text-gray-400">Conversion analytics and growth metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-white/10 hover:bg-white/5">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button onClick={exportReport} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'funnel', label: 'Conversion Funnel', icon: BarChart3 },
          { id: 'dropout', label: 'Dropout Analysis', icon: TrendingDown },
          { id: 'geographic', label: 'Geographic', icon: Users },
          { id: 'programs', label: 'Program Performance', icon: FileText }
        ].map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                selectedReport === report.id
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {report.label}
            </button>
          );
        })}
      </div>

      {selectedReport === 'funnel' && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4">Conversion Funnel Analysis</h2>
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const maxCount = Math.max(...stages.map(s => s.count), 1);
              const width = (stage.count / maxCount) * 100;
              const prevStage = stages[index - 1];
              const dropoff = prevStage && prevStage.count > 0 
                ? ((prevStage.count - stage.count) / prevStage.count * 100).toFixed(1) 
                : '0';

              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300">{stageLabels[stage.stage] || stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="metric-number text-white">{stage.count}</span>
                      {parseFloat(dropoff) > 0 && (
                        <span className={cn("text-xs", parseFloat(dropoff) > 30 ? "text-red-400" : "text-amber-400")}>
                          -{dropoff}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg flex items-center px-3"
                      style={{ width: `${width}%` }}
                    >
                      {width > 15 && (
                        <span className="text-xs text-white/80">
                          {stages[0].count > 0 ? ((stage.count / stages[0].count) * 100).toFixed(0) : 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedReport === 'geographic' && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4">Geographic Intelligence</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Country</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Total</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Enrolled</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map((country) => (
                  <tr key={country.country} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 text-white font-medium">{country.country}</td>
                    <td className="p-3 metric-number text-white">{country.total}</td>
                    <td className="p-3 metric-number text-green-400">{country.enrolled}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", country.conversionRate >= 50 ? "bg-green-500" : "bg-amber-500")}
                            style={{ width: `${country.conversionRate}%` }}
                          />
                        </div>
                        <span className="text-sm metric-number text-white">{country.conversionRate.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'programs' && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4">Program Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Program</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Enrolled</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Capacity</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-300">Fill Rate</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => {
                  const fillRate = (program.enrolled / program.capacity) * 100;
                  return (
                    <tr key={program.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white font-medium">{program.name}</td>
                      <td className="p-3 metric-number text-white">{program.enrolled}</td>
                      <td className="p-3 metric-number text-gray-400">{program.capacity}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", fillRate >= 80 ? "bg-green-500" : fillRate >= 50 ? "bg-amber-500" : "bg-red-500")}
                              style={{ width: `${Math.min(fillRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm metric-number text-white">{fillRate.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'dropout' && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4">Dropout Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-gray-400">Total Dropouts</p>
              <p className="text-2xl font-bold metric-number text-red-400">{dropoutStudents.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-gray-400">Retention Rate</p>
              <p className="text-2xl font-bold metric-number text-green-400">
                {students.length > 0 ? ((retainedStudents.length / students.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-gray-400">Avg Risk Score</p>
              <p className="text-2xl font-bold metric-number text-amber-400">
                {dropoutStudents.length > 0 
                  ? Math.round(dropoutStudents.reduce((sum, s) => sum + s.risk_score, 0) / dropoutStudents.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
