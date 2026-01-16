import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
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

      // Count unfeasible (at_risk) timetables
      const unfeasibleCount = feasibilityData?.filter(f => f.score_band === 'at_risk').length || 0;
      const strainedCount = feasibilityData?.filter(f => f.score_band === 'strained').length || 0;

      // Calculate unfeasible percentage
      const unfeasiblePercentage = totalStudentsAnalyzed > 0
        ? Math.round((unfeasibleCount / totalStudentsAnalyzed) * 100)
        : 0;

      // Count students flagged before attendance drop (those with viability risks)
      const flaggedBeforeAttendanceDrop = risksData?.length || 0;

      // Calculate average weeks of early warning
      const weeksToRiskValues = risksData?.map(r => r.weeks_to_risk) || [];
      const averageWeeksEarlyWarning = weeksToRiskValues.length > 0
        ? Math.round((weeksToRiskValues.reduce((a, b) => a + b, 0) / weeksToRiskValues.length) * 10) / 10
        : 0;

      // Generate anonymized examples (top 5 at-risk cases)
      const atRiskStudents = feasibilityData
        ?.filter(f => f.score_band === 'at_risk' || f.score_band === 'strained')
        .slice(0, 5) || [];

      const anonymizedExamples = atRiskStudents.map((f, index) => {
        const studentConflicts = conflictsData?.filter(c => c.student_id === f.student_id) || [];
        const studentRisk = risksData?.find(r => r.student_id === f.student_id);

        return {
          case_id: `CASE-${String(index + 1).padStart(3, '0')}`,
          feasibility_score: f.feasibility_score,
          score_band: f.score_band,
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
        type,
        count,
      }));

      const report = {
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

      return new Response(
        JSON.stringify({ success: true, data: report }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
