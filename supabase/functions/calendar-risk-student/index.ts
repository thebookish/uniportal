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
      const url = new URL(req.url);
      const studentId = url.searchParams.get('student_id');

      if (!studentId) {
        return new Response(
          JSON.stringify({ error: 'student_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Get calendar summary
      const { data: calendarSummary, error: summaryError } = await supabase
        .from('student_calendar_summary')
        .select('*')
        .eq('student_id', studentId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();

      // Get feasibility
      const { data: feasibility, error: feasibilityError } = await supabase
        .from('timetable_feasibility')
        .select('*')
        .eq('student_id', studentId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();

      // Get conflicts
      const { data: conflicts, error: conflictsError } = await supabase
        .from('calendar_conflicts')
        .select('*')
        .eq('student_id', studentId)
        .eq('resolved', false);

      // Get viability risk
      const { data: viabilityRisk, error: riskError } = await supabase
        .from('attendance_viability_risk')
        .select('*')
        .eq('student_id', studentId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get attendance rate
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('present')
        .eq('student_id', studentId);

      let attendanceRate: number | undefined;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter(a => a.present).length;
        attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
      }

      const studentDetail = {
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

      return new Response(
        JSON.stringify({ success: true, data: studentDetail }),
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
