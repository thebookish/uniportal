import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  User,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudentCalendarDetail } from '@/hooks/useCalendarIntelligence';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayAbbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface StudentCalendarDetailPanelProps {
  studentId: string;
  onClose: () => void;
}

export function StudentCalendarDetailPanel({
  studentId,
  onClose,
}: StudentCalendarDetailPanelProps) {
  const { detail, loading, error } = useStudentCalendarDetail(studentId);

  if (loading) {
    return (
      <div className="bg-[#0D1117] rounded-xl border border-white/10 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="bg-[#0D1117] rounded-xl border border-white/10 p-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-red-400">{error || 'Unable to load student details'}</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            {detail.student_name}
          </h3>
          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
            <Mail className="w-3 h-3" />
            {detail.student_email}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
        {/* Feasibility Score */}
        {detail.feasibility && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400 uppercase">Feasibility Score</h4>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'text-3xl font-bold font-mono',
                  detail.feasibility.score_band === 'feasible'
                    ? 'text-green-400'
                    : detail.feasibility.score_band === 'strained'
                    ? 'text-amber-400'
                    : 'text-red-400'
                )}
              >
                {detail.feasibility.feasibility_score}
              </div>
              <Badge
                className={cn(
                  'capitalize',
                  detail.feasibility.score_band === 'feasible'
                    ? 'bg-green-500/20 text-green-400'
                    : detail.feasibility.score_band === 'strained'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {detail.feasibility.score_band.replace('_', ' ')}
              </Badge>
            </div>

            {/* Factors */}
            {detail.feasibility.factors && detail.feasibility.factors.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase">Contributing Factors</p>
                {detail.feasibility.factors.map((factor: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start justify-between bg-white/5 rounded-lg p-3"
                  >
                    <span className="text-sm text-gray-300">{factor.description}</span>
                    <Badge
                      className={cn(
                        'ml-2 font-mono',
                        factor.impact < -15
                          ? 'bg-red-500/20 text-red-400'
                          : factor.impact < -5
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-gray-500/20 text-gray-400'
                      )}
                    >
                      {factor.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Weekly Calendar Visualization */}
        {detail.weekly_calendar && detail.weekly_calendar.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400 uppercase">Weekly Calendar</h4>
            <div className="grid grid-cols-7 gap-1">
              {dayAbbrev.map((day) => (
                <div key={day} className="text-xs text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const dayEvents = detail.weekly_calendar.filter(
                  (e: any) => e.day_of_week === dayIndex
                );
                const hasClass = dayEvents.some((e: any) => e.type === 'class');
                const hasWork = dayEvents.some((e: any) => e.type === 'work');
                const hasMandatory = dayEvents.some((e: any) => e.mandatory);

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'h-12 rounded-lg border flex flex-col items-center justify-center text-xs',
                      dayEvents.length === 0
                        ? 'border-white/5 bg-white/5'
                        : hasClass && hasWork
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : hasClass
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-purple-500/50 bg-purple-500/10'
                    )}
                  >
                    {dayEvents.length > 0 && (
                      <>
                        <span className="text-white font-medium">{dayEvents.length}</span>
                        <div className="flex gap-1 mt-0.5">
                          {hasClass && (
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          )}
                          {hasWork && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          )}
                          {hasMandatory && (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400" /> Class
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400" /> Work
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" /> Mandatory
              </span>
            </div>
          </div>
        )}

        {/* Calendar Summary Stats */}
        {detail.calendar_summary && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Class Hours</p>
              <p className="text-lg font-bold text-cyan-400">
                {detail.calendar_summary.total_class_hours?.toFixed(1) || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Mandatory</p>
              <p className="text-lg font-bold text-red-400">
                {detail.calendar_summary.total_mandatory_hours?.toFixed(1) || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Work Hours</p>
              <p className="text-lg font-bold text-purple-400">
                {detail.calendar_summary.total_work_hours?.toFixed(1) || 0}
              </p>
            </div>
          </div>
        )}

        {/* Conflicts */}
        {detail.conflicts && detail.conflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400 uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Detected Conflicts ({detail.conflicts.length})
            </h4>
            <div className="space-y-2">
              {detail.conflicts.map((conflict: any) => (
                <div
                  key={conflict.id}
                  className={cn(
                    'rounded-lg p-3 border',
                    conflict.severity === 'high'
                      ? 'border-red-500/30 bg-red-500/10'
                      : conflict.severity === 'medium'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-yellow-500/30 bg-yellow-500/10'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge
                        className={cn(
                          'text-xs mb-1',
                          conflict.severity === 'high'
                            ? 'bg-red-500/20 text-red-400'
                            : conflict.severity === 'medium'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        )}
                      >
                        {conflict.conflict_type.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm text-gray-300">{conflict.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">{conflict.day}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viability Risk */}
        {detail.viability_risk && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              Attendance Viability Risk
            </h4>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-red-500/20 text-red-400">
                  {detail.viability_risk.weeks_to_risk} week
                  {detail.viability_risk.weeks_to_risk !== 1 ? 's' : ''} to risk
                </Badge>
                <span className="text-xs text-gray-500 capitalize">
                  {detail.viability_risk.confidence} confidence
                </span>
              </div>
              {detail.viability_risk.reasons && (
                <ul className="space-y-1 mb-3">
                  {detail.viability_risk.reasons.map((reason: string, i: number) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
              {detail.viability_risk.recommendation && (
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <p className="text-sm text-cyan-400 italic">
                    → {detail.viability_risk.recommendation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Rate */}
        {detail.attendance_rate !== undefined && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400 uppercase">Attendance Rate</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    detail.attendance_rate >= 80
                      ? 'bg-green-400'
                      : detail.attendance_rate >= 60
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  )}
                  style={{ width: `${detail.attendance_rate}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-lg font-bold font-mono',
                  detail.attendance_rate >= 80
                    ? 'text-green-400'
                    : detail.attendance_rate >= 60
                    ? 'text-amber-400'
                    : 'text-red-400'
                )}
              >
                {detail.attendance_rate}%
              </span>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!detail.feasibility && !detail.weekly_calendar?.length && !detail.conflicts?.length && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No calendar data available for this student</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload academic timetable data to begin analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
