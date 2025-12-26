import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { usePrograms } from '@/hooks/usePrograms';
import { useLifecycleStats } from '@/hooks/useLifecycleStats';
import { BarChart3, TrendingUp, TrendingDown, Globe, Download, Sparkles, Loader2, Target, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MarketingView() {
  const { students, loading: studentsLoading } = useStudents();
  const { programs, loading: programsLoading } = usePrograms();
  const { stages, loading: stagesLoading } = useLifecycleStats();

  const loading = studentsLoading || programsLoading || stagesLoading;

  const countryStats = students.reduce((acc: Record<string, number>, student) => {
    acc[student.country] = (acc[student.country] || 0) + 1;
    return acc;
  }, {});

  const sortedCountries = Object.entries(countryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const sourceStats = students.reduce((acc: Record<string, number>, student) => {
    const source = student.source || 'direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const programStats = programs.map(program => {
    const enrolled = students.filter(s => s.program_id === program.id).length;
    return {
      ...program,
      actualEnrolled: enrolled,
      conversionRate: program.capacity > 0 ? (enrolled / program.capacity) * 100 : 0
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);

  const totalLeads = stages.find(s => s.stage === 'lead')?.count || 0;
  const totalEnrolled = stages.find(s => s.stage === 'active')?.count || 0;
  const overallConversion = totalLeads > 0 ? ((totalEnrolled / totalLeads) * 100).toFixed(1) : '0';

  const funnelData = stages.slice(0, 7).map((stage, index, arr) => {
    const prevCount = index > 0 ? arr[index - 1].count : stage.count;
    const dropoff = prevCount > 0 ? ((prevCount - stage.count) / prevCount * 100).toFixed(1) : '0';
    return { ...stage, dropoff: parseFloat(dropoff) };
  });

  const maxDropoff = Math.max(...funnelData.map(f => f.dropoff));
  const worstDropoffStage = funnelData.find(f => f.dropoff === maxDropoff);

  async function exportReport() {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: students.length,
        totalLeads,
        totalEnrolled,
        overallConversion: `${overallConversion}%`
      },
      funnelAnalysis: funnelData,
      topCountries: sortedCountries,
      programPerformance: programStats.slice(0, 5)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const stageLabels: Record<string, string> = {
    lead: 'Lead',
    application: 'Application',
    offer: 'Offer',
    acceptance: 'Acceptance',
    enrollment: 'Enrollment',
    onboarding: 'Onboarding',
    active: 'Active'
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Marketing Analytics</h1>
          <p className="text-sm md:text-base text-gray-400">Funnel analysis, channel performance, and conversion insights</p>
        </div>
        <Button onClick={exportReport} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
            <span className="text-xs md:text-sm text-gray-400">Total Leads</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{totalLeads}</p>
        </div>

        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 md:w-5 h-4 md:h-5 text-green-400" />
            <span className="text-xs md:text-sm text-gray-400">Enrolled</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{totalEnrolled}</p>
        </div>

        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-orange-400" />
            <span className="text-xs md:text-sm text-gray-400">Conversion Rate</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-orange-400">{overallConversion}%</p>
        </div>

        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 md:w-5 h-4 md:h-5 text-purple-400" />
            <span className="text-xs md:text-sm text-gray-400">Countries</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold metric-number text-white">{Object.keys(countryStats).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Conversion Funnel
            </h2>
            {worstDropoffStage && worstDropoffStage.dropoff > 20 && (
              <span className="ai-badge">
                <Sparkles className="w-3 h-3" />
                High drop-off at {stageLabels[worstDropoffStage.stage]}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {funnelData.map((stage, index) => {
              const maxCount = Math.max(...funnelData.map(s => s.count), 1);
              const width = (stage.count / maxCount) * 100;

              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300">{stageLabels[stage.stage] || stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="metric-number text-white">{stage.count}</span>
                      {stage.dropoff > 0 && (
                        <span className={cn(
                          "text-xs",
                          stage.dropoff > 30 ? "text-red-400" : stage.dropoff > 15 ? "text-amber-400" : "text-gray-500"
                        )}>
                          -{stage.dropoff}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-6 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg flex items-center px-2"
                      style={{ width: `${width}%` }}
                    >
                      {width > 20 && (
                        <span className="text-xs text-white/80">
                          {funnelData[0].count > 0 ? ((stage.count / funnelData[0].count) * 100).toFixed(0) : 0}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {worstDropoffStage && worstDropoffStage.dropoff > 20 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Insight: Focus on improving {stageLabels[worstDropoffStage.stage]} stage conversion
              </p>
            </div>
          )}
        </div>

        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Geographic Distribution
          </h2>

          <div className="space-y-3">
            {sortedCountries.map(([country, count], index) => {
              const maxCount = sortedCountries[0][1];
              const width = (count / maxCount) * 100;

              return (
                <div key={country}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300">{country}</span>
                    <span className="metric-number text-white">{count}</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {sortedCountries.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Top market: {sortedCountries[0][0]} ({((sortedCountries[0][1] / students.length) * 100).toFixed(0)}% of students)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Program Performance
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-300">Program</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-300">Department</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-300">Enrolled</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-300">Capacity</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-300">Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {programStats.map((program) => (
                <tr key={program.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{program.name}</span>
                      {program.conversionRate >= 80 && (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                          High Demand
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-gray-400">{program.department}</td>
                  <td className="p-3 metric-number text-white">{program.enrolled}</td>
                  <td className="p-3 metric-number text-gray-400">{program.capacity}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            program.conversionRate >= 80 ? "bg-green-500" :
                            program.conversionRate >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(program.conversionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm metric-number text-white">
                        {program.conversionRate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-4 md:p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          AI Recommendations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">Focus Regions</h3>
            <p className="text-sm text-gray-400 mb-3">
              Based on conversion data, consider increasing marketing efforts in:
            </p>
            <div className="flex flex-wrap gap-2">
              {sortedCountries.slice(0, 3).map(([country]) => (
                <Badge key={country} className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {country}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">High-Performing Programs</h3>
            <p className="text-sm text-gray-400 mb-3">
              These programs have the highest demand:
            </p>
            <div className="flex flex-wrap gap-2">
              {programStats.slice(0, 3).map((program) => (
                <Badge key={program.id} className="bg-green-500/10 text-green-400 border-green-500/30">
                  {program.name.split(' ')[0]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">Optimization Opportunity</h3>
            <p className="text-sm text-gray-400 mb-3">
              {worstDropoffStage && worstDropoffStage.dropoff > 10 ? (
                <>Reduce drop-off at {stageLabels[worstDropoffStage.stage]} stage to improve overall conversion by up to {(worstDropoffStage.dropoff * 0.5).toFixed(0)}%</>
              ) : (
                <>Funnel is performing well. Focus on increasing top-of-funnel leads.</>
              )}
            </p>
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
              View Details <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
