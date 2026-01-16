import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttendanceInput {
  student_id: string;
  date: string;
  present: boolean;
  event_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Support single record or batch
      const records: AttendanceInput[] = Array.isArray(body) ? body : [body];
      
      const insertData = records.map((record) => ({
        student_id: record.student_id,
        date: record.date,
        present: record.present,
        event_id: record.event_id,
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(insertData)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data, message: `${data.length} attendance record(s) created` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
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
