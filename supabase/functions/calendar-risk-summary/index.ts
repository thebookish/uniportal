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
        ? Math.round(totalScores / feasibilityData.length) 
        : 0;

      const summary = {
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
        active_viability_risks: riskData?.length || 0,
      };

      return new Response(
        JSON.stringify({ success: true, data: summary }),
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
