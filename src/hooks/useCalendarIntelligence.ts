import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  CalendarRiskSummary,
  StudentCalendarDetail,
  TimetableFeasibility,
  CalendarConflict,
  AttendanceViabilityRisk,
  PilotReportData,
  WeeklyCalendarBlock,
} from '@/types/calendar';

interface StudentCalendarDetailExtended extends StudentCalendarDetail {
  calendar_summary?: {
    total_class_hours: number;
    total_mandatory_hours: number;
    total_work_hours: number;
    free_time_blocks: any[];
  };
}

export function useCalendarRiskSummary() {
  const [summary, setSummary] = useState<CalendarRiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all feasibility scores
      const { data: feasibilityData, error: feasibilityError } = await supabase
        .from('timetable_feasibility')
        .select('feasibility_score, score_band, student_id')
        .order('created_at', { ascending: false });

      if (feasibilityError) throw feasibilityError;

      // Get all active viability risks
      const { data: riskData, error: riskError } = await supabase
        .from('attendance_viability_risk')
        .select('*')
        .eq('active', true);

      if (riskError) throw riskError;

      // Get all conflicts
      const { data: conflictsData, error: conflictsError } = await supabase
        .from('calendar_conflicts')
        .select('*')
        .eq('resolved', false);

      if (conflictsError) throw conflictsError;

      // Calculate summary metrics
      const uniqueStudents = new Set(feasibilityData?.map(f => f.student_id) || []);
      const totalStudentsAnalyzed = uniqueStudents.size;

      const strainedCount = feasibilityData?.filter(f => f.score_band === 'strained').length || 0;
      const atRiskCount = feasibilityData?.filter(f => f.score_band === 'at_risk').length || 0;

      const totalScores = feasibilityData?.reduce((sum, f) => sum + f.feasibility_score, 0) || 0;
      const averageFeasibilityScore = totalStudentsAnalyzed > 0 
        ? Math.round(totalScores / (feasibilityData?.length || 1)) 
        : 0;

      const calculatedSummary: CalendarRiskSummary = {
        total_students_analyzed: totalStudentsAnalyzed,
        strained_timetables_count: strainedCount,
        strained_timetables_percentage: totalStudentsAnalyzed > 0 
          ? Math.round((strainedCount / totalStudentsAnalyzed) * 100) 
          : 0,
        at_risk_count: atRiskCount,
        at_risk_percentage: totalStudentsAnalyzed > 0 
          ? Math.round((atRiskCount / totalStudentsAnalyzed) * 100) 
          : 0,
        conflicts_detected: conflictsData?.length || 0,
        average_feasibility_score: averageFeasibilityScore,
      };

      setSummary(calculatedSummary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

export function useStudentCalendarDetail(studentId: string | null) {
  const [detail, setDetail] = useState<StudentCalendarDetailExtended | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!studentId) {
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Get calendar summary
      const { data: calendarSummary } = await supabase
        .from('student_calendar_summary')
        .select('*')
        .eq('student_id', studentId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();

      // Get feasibility
      const { data: feasibility } = await supabase
        .from('timetable_feasibility')
        .select('*')
        .eq('student_id', studentId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();

      // Get conflicts
      const { data: conflicts } = await supabase
        .from('calendar_conflicts')
        .select('*')
        .eq('student_id', studentId)
        .eq('resolved', false);

      // Get viability risk
      const { data: viabilityRisk } = await supabase
        .from('attendance_viability_risk')
        .select('*')
        .eq('student_id', studentId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get attendance rate
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('present')
        .eq('student_id', studentId);

      let attendanceRate: number | undefined;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(a => a.present).length;
        attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
      }

      const studentDetail: StudentCalendarDetailExtended = {
        student_id: student.id,
        student_name: student.name,
        student_email: student.email,
        weekly_calendar: calendarSummary?.weekly_calendar || [],
        feasibility: feasibility || null,
        conflicts: conflicts || [],
        viability_risk: viabilityRisk || null,
        attendance_rate: attendanceRate,
        calendar_summary: {
          total_class_hours: calendarSummary?.total_class_hours || 0,
          total_mandatory_hours: calendarSummary?.total_mandatory_hours || 0,
          total_work_hours: calendarSummary?.total_work_hours || 0,
          free_time_blocks: calendarSummary?.free_time_blocks || [],
        },
      };

      setDetail(studentDetail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
}

export function useTimetableFeasibility() {
  const [feasibilityList, setFeasibilityList] = useState<TimetableFeasibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeasibility = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('timetable_feasibility')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            program_id,
            programs:program_id (name)
          )
        `)
        .order('feasibility_score', { ascending: true });

      if (fetchError) throw fetchError;
      setFeasibilityList(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeasibility();
  }, [fetchFeasibility]);

  return { feasibilityList, loading, error, refetch: fetchFeasibility };
}

export function useCalendarConflicts() {
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConflicts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('calendar_conflicts')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email
          )
        `)
        .eq('resolved', false)
        .order('severity', { ascending: false });

      if (fetchError) throw fetchError;
      setConflicts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  return { conflicts, loading, error, refetch: fetchConflicts };
}

export function useViabilityRisks() {
  const [risks, setRisks] = useState<AttendanceViabilityRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('attendance_viability_risk')
        .select(`
          *,
          students:student_id (
            id,
            name,
            email,
            program_id,
            programs:program_id (name)
          )
        `)
        .eq('active', true)
        .order('weeks_to_risk', { ascending: true });

      if (fetchError) throw fetchError;
      setRisks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  return { risks, loading, error, refetch: fetchRisks };
}

export function usePilotReport() {
  const [report, setReport] = useState<PilotReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all feasibility data
      const { data: feasibilityData, error: feasibilityError } = await supabase
        .from('timetable_feasibility')
        .select('*')
        .order('week_start', { ascending: false });

      if (feasibilityError) throw feasibilityError;

      // Get all conflicts
      const { data: conflictsData, error: conflictsError } = await supabase
        .from('calendar_conflicts')
        .select('*');

      if (conflictsError) throw conflictsError;

      // Get all viability risks
      const { data: risksData, error: risksError } = await supabase
        .from('attendance_viability_risk')
        .select('*')
        .eq('active', true);

      if (risksError) throw risksError;

      // Calculate report metrics
      const uniqueStudents = new Set(feasibilityData?.map(f => f.student_id) || []);
      const totalStudentsAnalyzed = uniqueStudents.size;

      const unfeasibleCount = feasibilityData?.filter(f => f.score_band === 'at_risk').length || 0;
      const strainedCount = feasibilityData?.filter(f => f.score_band === 'strained').length || 0;

      const unfeasiblePercentage = totalStudentsAnalyzed > 0
        ? Math.round((unfeasibleCount / totalStudentsAnalyzed) * 100)
        : 0;

      const flaggedBeforeAttendanceDrop = risksData?.length || 0;

      const weeksToRiskValues = risksData?.map(r => r.weeks_to_risk) || [];
      const averageWeeksEarlyWarning = weeksToRiskValues.length > 0
        ? Math.round((weeksToRiskValues.reduce((a, b) => a + b, 0) / weeksToRiskValues.length) * 10) / 10
        : 0;

      // Generate anonymized examples
      const atRiskStudents = feasibilityData
        ?.filter(f => f.score_band === 'at_risk' || f.score_band === 'strained')
        .slice(0, 5) || [];

      const anonymizedExamples = atRiskStudents.map((f, index) => {
        const studentConflicts = conflictsData?.filter(c => c.student_id === f.student_id) || [];
        const studentRisk = risksData?.find(r => r.student_id === f.student_id);

        return {
          case_id: `CASE-${String(index + 1).padStart(3, '0')}`,
          feasibility_score: f.feasibility_score,
          score_band: f.score_band as any,
          conflicts_count: studentConflicts.length,
          primary_conflict_type: studentConflicts[0]?.conflict_type || 'none',
          weeks_to_risk: studentRisk?.weeks_to_risk || 0,
        };
      });

      // Conflict breakdown by type
      const conflictCounts: { [key: string]: number } = {};
      for (const conflict of conflictsData || []) {
        conflictCounts[conflict.conflict_type] = (conflictCounts[conflict.conflict_type] || 0) + 1;
      }

      const conflictBreakdown = Object.entries(conflictCounts).map(([type, count]) => ({
        type: type as any,
        count,
      }));

      const generatedReport: any = {
        report_generated_at: new Date().toISOString(),
        total_students_analyzed: totalStudentsAnalyzed,
        unfeasible_timetables_count: unfeasibleCount,
        unfeasible_timetables_percentage: unfeasiblePercentage,
        strained_timetables_count: strainedCount,
        strained_timetables_percentage: totalStudentsAnalyzed > 0
          ? Math.round((strainedCount / totalStudentsAnalyzed) * 100)
          : 0,
        flagged_before_attendance_drop: flaggedBeforeAttendanceDrop,
        average_weeks_early_warning: averageWeeksEarlyWarning,
        anonymized_examples: anonymizedExamples,
        conflict_breakdown: conflictBreakdown,
        summary_insights: [
          `${totalStudentsAnalyzed} students analyzed for timetable feasibility`,
          `${unfeasibleCount} students (${unfeasiblePercentage}%) have unfeasible timetables`,
          `${flaggedBeforeAttendanceDrop} students flagged for early intervention`,
          `Average early warning window: ${averageWeeksEarlyWarning} weeks before potential attendance issues`,
          conflictBreakdown.length > 0
            ? `Most common conflict type: ${conflictBreakdown.sort((a, b) => b.count - a.count)[0]?.type || 'none'}`
            : 'No conflicts detected',
        ],
      };

      setReport(generatedReport);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, error, fetchReport };
}

export function useAnalyzeTimetable() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTimetable = useCallback(async (studentId?: string) => {
    setAnalyzing(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'supabase-functions-analyze-timetable-feasibility',
        {
          body: studentId ? { student_id: studentId } : { analyze_all: true },
        }
      );

      if (invokeError) throw invokeError;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return { analyzeTimetable, analyzing, error };
}
